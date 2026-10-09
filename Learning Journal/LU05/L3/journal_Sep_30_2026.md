# Unit CIS_114_01 - 26/FA 

# Lecture 
Date: Sep 30th 2026

### Connecting ollama to a Web UI (docker container setup)

### key terms
multimodal - ability to process understand and generate different types of data e.g. text, audio, video.
text only - only able to accept strings as input and generate text as output
reasoning loops - ai is able to self prompt and terms it as "self thought" as it works to deliver its final answer ( usually seen when putting it in verbose mode)
Deployment - Packaging application source code, runtime, and dependencies so it executes identically on any host server

## Rough outline of lecture
talked about the wearable ai charm from facebook, which reminded me of the Apple strap they sold to keep airpods secure, even through airpods are essentially wireless, money making without enguinuity, anyway muse is the agent on the charm, and the charm looks like a apple watch and a rubix cube combined.
talked about meta products, quite interesting.
pivoted to setting up the web ui that way we can replace going to the terminal to use qwen and instead use OpenWebUI/Alpaca style interface.
went over the basics of app deployment using Dockerfiles and Docker Compose YAML files to package Python applications and their dependencies so they run consistently on any machine


## Direct Quote from Instructor
most mainstream models do not have verbose mode because they want to hide their "proprietary" code and reasoning.

## Real-World Applications
hosting open-weight AI models locally gives companies complete data privacy for compliance reasons, industries such as finance and healthcare have strict federal requirements to safe guard client privacy (and anonymity).

## HUMAN written notes summarizing the lecture
learned how to launch a web interface container and link it to our local Ollama setup using Docker port mapping and environment variables. The Qwen Model i was using was not multimodal so even though i was able to get it working, it was still only text based, i couldnt upload images/videos.



# A diagram / Flow chart / Mind Map
