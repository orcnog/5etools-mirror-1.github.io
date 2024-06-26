# This ingests a binary audio file from an HTTP POST, stores the audio file in an S3 bucket (orcnog-audiofilesbucket), and then sends that audio to openai and awaits the transcription result.
# To test, use Postman to send a request to https://ghseg8im58.execute-api.us-east-2.amazonaws.com/default/opanAiTranscribeTestPython
#   for the body, attach a binary (mp3 file), and then in the Headers, supply a header Content-Type:audio/mpeg (for an mp3).

import json
import boto3
import uuid
import logging
import os
import openai
import tempfile
import wave
import io
from base64 import b64decode
from botocore.exceptions import ClientError

logger = logging.getLogger()
logger.setLevel(logging.INFO)

s3 = boto3.client('s3')
openai.api_key = os.getenv('OPENAI_API_KEY')

BUCKET_NAME = os.getenv('BUCKET_ID')
MIN_RECORDING_LENGTH_IN_SEC = 0.5
MAX_RECORDING_LENGTH_IN_SEC = 30
MAX_BYTES_FOR_UPLOADED_AUDIO = 32000
VOCABULARY_NAME = 'initiative-order'
ALLOWED_CONTENT_TYPES = {
    'video/webm;codecs=vp9': 'webm',
    'video/webm;codecs=vp8': 'webm',
    'video/webm': 'webm',
    'video/mp4': 'mp4',
    'audio/webm;codecs=opus': 'webm',
    'audio/webm': 'webm',
    'audio/ogg;codecs=opus': 'ogg',
    'audio/ogg': 'ogg',
    'audio/mp4;codecs=aac': 'mp4',
    'audio/mp4': 'mp4',
    'audio/mpeg': 'mp3',
    'audio/aac': 'aac',
    'audio/wav': 'wav',
}


def get_wav_duration(wav_data):
    with wave.open(io.BytesIO(wav_data), 'rb') as wav_file:
        frames = wav_file.getnframes()
        rate = wav_file.getframerate()
        duration = frames / float(rate)
        return duration

def lambda_handler(event, context):
    logger.info("Received event: " + json.dumps(event, indent=2))
    output = []

    # Handle CORS preflight request
    if event['httpMethod'] == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'OPTIONS,POST',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
            'body': json.dumps(output, indent=2)
        }

    try:
        # Get the Content-Type header
        content_type = event['headers'].get('Content-Type', 'application/octet-stream')
        file_extension = ""
        file_content = ""

        if content_type not in ALLOWED_CONTENT_TYPES:
            logger.info(f"Content type {content_type} is unsupported. Exiting.")
            output.append(f"Content type {content_type} is unsupported. Exiting.")
            return {
                'statusCode': 400,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'OPTIONS,POST',
                    'Access-Control-Allow-Headers': 'Content-Type',
                },
                'body': json.dumps(output, indent=2)
            }
        else:
            file_extension = ALLOWED_CONTENT_TYPES[content_type]
            logger.info(f"Content-Type: {content_type}, File Extension: {file_extension}")
            output.append(f"Content-Type: {content_type}, File Extension: {file_extension}")

        # Check if the body is present
        if 'body' in event and event['body'] is not None:
            # Decode the body if it exists
            try:
                # Check if body is base64-encoded and decode it
                if event.get('isBase64Encoded'):
                    logger.info("Body is base64 encoded")
                    output.append("Body is base64 encoded")
                    file_content = b64decode(event['body'])
                else:
                    logger.info("Body is not base64 encoded")
                    output.append("Body is not base64 encoded")
                    file_content = event['body'].encode('utf-8')
            except Exception as e:
                logger.error(f"Error decoding file content: {e}")
                output.append(f"Error decoding file content: {e}")
                return {
                    'statusCode': 400,
                    'headers': {
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'OPTIONS,POST',
                        'Access-Control-Allow-Headers': 'Content-Type',
                    },
                    'body': json.dumps(output, indent=2)
                }
        else:
            logger.info("No body content to process")
            output.append("No body content to process")

        # Check the file size before uploading
        if content_type == 'audio/wav':
            # Check if the content type is WAV first
            duration = get_wav_duration(file_content)
            logger.info(f"Audio duration: {duration} seconds")
            
            if duration < MIN_RECORDING_LENGTH_IN_SEC:
                return {
                    'statusCode': 400,
                    'body': json.dumps({"error": f"Audio file too short: {duration} sec"}),
                    'headers': {
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'OPTIONS,POST',
                        'Access-Control-Allow-Headers': 'Content-Type',
                    }
                }
            
            if duration > MAX_RECORDING_LENGTH_IN_SEC:
                return {
                    'statusCode': 400,
                    'body': json.dumps({"error": f"Audio file too long: {duration} sec"}),
                    'headers': {
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'OPTIONS,POST',
                        'Access-Control-Allow-Headers': 'Content-Type',
                    }
                }
        else:
            # Otherwise check the file's raw size in bytes
            file_size = len(file_content)
            logger.info(f"File size: {file_size} bytes")
            if duration < 1 or file_size < MAX_BYTES_FOR_UPLOADED_AUDIO:
                logger.info("Audio file size is too small to contain meaningful data.")
                output.append(f"Audio file size is too small to contain meaningful data: {file_size} bytes")
                return {
                    'statusCode': 400,
                    'body': json.dumps({"error": f"Audio file size is too small to contain meaningful data: {file_size} bytes"}),
                    'headers': {
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'OPTIONS,POST',
                        'Access-Control-Allow-Headers': 'Content-Type',
                    }
                }

        # Set up a prompt, if the 'prompt' query string was passed
        prompt = event['queryStringParameters'].get('prompt', '')

        # Write the file content to a temporary file
        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix=f".{file_extension}") as temp_file:
                temp_file.write(file_content)
                temp_file_path = temp_file.name
            logger.info(f"Temporary file created at: {temp_file_path}")

            # Verify the temporary file
            with open(temp_file_path, "rb") as f:
                file_check_content = f.read()
            logger.info(f"Temporary file content size: {len(file_check_content)} bytes")
        except Exception as e:
            logger.error(f"Error writing temporary file: {e}")
            output.append(f"Error writing temporary file: {e}")
            return {
                'statusCode': 500,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'OPTIONS,POST',
                    'Access-Control-Allow-Headers': 'Content-Type',
                },
                'body': json.dumps(output, indent=2)
            }

        # Use the temporary file for OpenAI transcription
        try:
            with open(temp_file_path, "rb") as audio_file:
                response = openai.Audio.transcribe(
                    model="whisper-1",
                    file=audio_file,
                    prompt=prompt  # Include the prompt
                )
            logger.info("Transcription response: " + json.dumps(response, indent=2))
            output.append("Transcription response:")
            output.append(json.dumps(response, indent=2))
        except Exception as e:
            logger.error(f"Error in OpenAI transcription: {e}")
            output.append(f"Error in OpenAI transcription: {e}")
            return {
                'statusCode': 500,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'OPTIONS,POST',
                    'Access-Control-Allow-Headers': 'Content-Type',
                },
                'body': json.dumps(output, indent=2)
            }
        finally:
            os.remove(temp_file_path)  # Clean up the temporary file
            logger.info(f"Temporary file {temp_file_path} deleted")


        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'OPTIONS,POST',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
            'body': json.dumps(response)
        }

    except ClientError as e:
        logger.error(f"ClientError: {str(e)}")
        output.append("ClientError...")
        output.append(e)
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'OPTIONS,POST',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
            'body': json.dumps(output, indent=2)
        }
    except Exception as e:
        logger.error(f"Exception: {str(e)}")
        output.append(f"Exception: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'OPTIONS,POST',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
            'body': json.dumps(output, indent=2)
        }
