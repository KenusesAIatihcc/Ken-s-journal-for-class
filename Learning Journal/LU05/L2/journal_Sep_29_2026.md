# Unit CIS_114_01 - 26/FA 

# Lecture 
Date: Sep 29th 2026

### Running AI Locally with Ollama and Docker

## Rough outline of lecture
spoke about starships for a bit which is wildly interesting, landing the rocket safely is still a work in progress.
bulk of the lecture was about : installing Ollama using Docker. Downloaded an AI model (qwen3.5).Ran the model and asked it a question. Looked at its reasoning and final response. Checked the token generation statistics.
AI generates responses one token at a time, A token is usually part of a word or a short group of characters, ai uses these fragments to "consume" information. Tokens per second tells you how quickly the model produces its response.

## Direct Quote from Instructor
if you dont know if your laptop/computer has a GPU then it probably does not.
A GPU can make AI run much faster than using only a CPU.
## Real-World Applications
computer power/processing is greatly affected and directly correlated to AI "thinking parameters" careful consideration should be put in place if AI is to be implemented in the workplace and run locally. A company/IT should do a cost per use analysis to determine if cloud providers subscription models make more sense than having AI run locally.

## HUMAN written notes summarizing the lecture
able to setup Ollama via docker, well inside a docker conntainer. The first time i had ollama i had too many parameters and my laptop wasnt able to sustain the processing power, i had also installe dit locally so it was using up alot of system processes. THis version of ollama is less parameters and also installed it on the docker container on the laptop. We downloaded Qwen and practiced navigating the containerized command line.
Docker: Helps run Ollama in a container that can be stopped or removed.
CPU vs. GPU: A GPU can make model generation much faster.
Model size: Larger models need more resources but may give better answers.
Tokens per second: Measures how fast the model generates text.
Prompting: Clear instructions can improve the response.
AI limitations: Always check the answer because the model can make mistakes.
# A diagram / Flow chart / Mind Map

### **Docker Install** ------> **Ollama Install** ------> **Download model** ------> **Enter Prompt**