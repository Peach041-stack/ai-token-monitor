import json
import subprocess

def extract_json(output):
    try:
        start = -1
        for i, c in enumerate(output):
            if c in '{[':
                start = i
                break
        if start != -1:
            return json.loads(output[start:])
    except Exception as e:
        print("Exception:", e)
        # Try finding the end of JSON
        end = -1
        for i in range(len(output)-1, -1, -1):
            if output[i] in '}]':
                end = i
                break
        if start != -1 and end != -1 and end >= start:
            try:
                return json.loads(output[start:end+1])
            except Exception as e2:
                print("Exception 2:", e2)
    return None

res = subprocess.run("npx -y codeburn report -p week --format json", shell=True, capture_output=True, text=True)
print("Output length:", len(res.stdout))
print("First 50 chars:", repr(res.stdout[:50]))
print("Last 50 chars:", repr(res.stdout[-50:]))
j2 = extract_json(res.stdout)
if j2:
    print("Models:", len(j2.get("models", [])))
else:
    print("Failed to parse JSON")
