import json
import boto3
import time
import os
import urllib.parse
from google import genai

# Initialize AWS S3 client
s3 = boto3.client('s3')

def process_video_with_gemini(local_file_path):
    """
    Uploads the video to Gemini, waits for processing, and generates a report.
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise Exception("GEMINI_API_KEY environment variable is not set.")
        
    # Initialize the new Google GenAI Client
    client = genai.Client(api_key=api_key)
    
    print("Uploading video to Gemini...")
    video_file = client.files.upload(file=local_file_path)
    
    # Wait for the video to be processed by Gemini
    print("Waiting for video processing to complete...")
    while video_file.state.name == "PROCESSING":
        print(".", end="", flush=True)
        time.sleep(5)
        video_file = client.files.get(name=video_file.name)
        
    if video_file.state.name == "FAILED":
        raise Exception("Video processing failed in Gemini.")
        
    print("\nVideo processing complete. Generating report...")
    
    prompt = """
    Analyze this video and generate a detailed JSON report. 
    Focus strictly on identifying these 5 categories of incidents. If a category is not present, mark it as false or null.

    1. Accident: Were there any accidents/collisions? If yes, identify the vehicles involved and any visible number plates.
    2. Theft/Robbery: Did a theft or robbery occur? If yes, describe exactly how it happened.
    3. Harassment: Was there any harassment or physical violence? If yes, describe to whom it happened.
    4. Kidnapping: Was there a kidnapping or abduction? If yes, describe who was kidnapped and how.
    5. Suspicious Activities: Were there any suspicious activities? If yes, describe what happened.
    
    Return the output EXCLUSIVELY as a valid JSON object with the following structure:
    {
        "incident_detected": "Accident | Theft | Harassment | Kidnapping | Suspicious | None",
        "accident_details": {"occurred": bool, "vehicles": [], "number_plates": []},
        "theft_details": {"occurred": bool, "how_it_happened": "string"},
        "harassment_details": {"occurred": bool, "to_whom": "string"},
        "kidnapping_details": {"occurred": bool, "who_and_how": "string"},
        "suspicious_activities": {"occurred": bool, "what_happened": "string"},
        "general_summary": "A brief 2-sentence summary of the video."
    }
    """
    
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[video_file, prompt]
        )
    except Exception as e:
        print("Error generating content. Fetching list of available models to help debug...")
        try:
            available_models = []
            for m in client.models.list():
                available_models.append(m.name)
            print("AVAILABLE MODELS: ", available_models)
        except Exception as list_e:
            print("Could not fetch models: ", list_e)
        raise e
    
    # Clean up the file from Google's servers
    client.files.delete(name=video_file.name)
    
    return response.text

def lambda_handler(event, context):
    print("Received event: " + json.dumps(event))
    
    for record in event['Records']:
        local_file_path = None
        try:
            # SQS message body contains the S3 event
            body = json.loads(record['body'])
            
            if 'Records' not in body:
                print("No S3 records found in the SQS message body.")
                continue
                
            for s3_record in body['Records']:
                event_name = s3_record.get('eventName', '')
                # Ignore ObjectRemoved or other non-creation events
                if not event_name.startswith('ObjectCreated'):
                    print(f"Ignoring non-creation event: {event_name}")
                    continue
                    
                bucket = s3_record['s3']['bucket']['name']
                key = urllib.parse.unquote_plus(s3_record['s3']['object']['key'])
                
                print(f"Downloading video from S3: s3://{bucket}/{key}")
                
                # Download file to Lambda's /tmp directory
                local_file_path = f"/tmp/{os.path.basename(key)}"
                s3.download_file(bucket, key, local_file_path)
                
                # Process with Gemini
                report_text = process_video_with_gemini(local_file_path)
                
                # Clean up markdown formatting if Gemini returned code blocks
                if report_text.startswith("```json"):
                    report_text = report_text[7:-3].strip()
                elif report_text.startswith("```"):
                    report_text = report_text[3:-3].strip()
                    
                report = json.loads(report_text)
                
                # Save it to a JSON file locally in /tmp as requested (and keep it / wait)
                report_path = f"/tmp/report_{os.path.basename(key)}.json"
                with open(report_path, 'w') as f:
                    json.dump(report, f, indent=4)
                    
                print(f"Report generated successfully for {key}:")
                print(json.dumps(report, indent=4))
                
        except Exception as e:
            print(f"Error processing record: {e}")
            raise e
        finally:
            # Clean up the local video file to free up Lambda /tmp space
            if local_file_path and os.path.exists(local_file_path):
                os.remove(local_file_path)

    return {
        'statusCode': 200,
        'body': json.dumps('Successfully processed SQS records using Gemini API.')
    }
