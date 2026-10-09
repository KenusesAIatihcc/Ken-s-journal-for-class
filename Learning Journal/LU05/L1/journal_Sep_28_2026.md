# Unit CIS_114_01 - 26/FA 

# Lecture 
Date: Sep 28th 2026  
### AI Deployment and Docker

## Rough outline of lecture
why we are talking about VMs inan AI class is because we need to know how environments work so we can deploy and run local AI models.
Image vs. Container: An Image is a read-only template; a Container is a writeable, running instance of that template.
### key terms
emulation
decompilation - taking compiled code and turning it back into source code, in order to tweak it.
Recompilation - opposite of decompilation, rebuilding tweaked source code into use.
containers - docker , podman 
OS - operating system
on prem - on premises i.e running your own physical hardware to include servers versus using cloud infrastructure
fundamental elements of the universe of docker are the dockerfile, image, container
docker file - the DNA, code that tells docker how to build an image which itself is  asnapshot of your software along with all of its dependencies down to the OS level.
image - the frozen read only package of the OS and its dependcies.
container - the live isolated instance of the image

## Direct Quote from Instructor


## Real-World Applications
You could put multiple applications in one virtual machine and they could directly interact with each other; containers (Docker) allow us a little bit of a middleground especially if we want each application to run in its own little sandbox and we don't want the overhead of running a virtual machine for every instance.
ofcourse this brings in Kubernetes but im guessing that is more of a cloud class than this AI class and thats why it wasnt mentioned.
docker eliminates enables a sort of benchmark because software behaves identically on a local laptop, as it will on an on prem server and even in the cloud.

## HUMAN written notes summarizing the lecture
VM's run their own operating system, so they tend to be bulky and slow, a docker container on the other hand instead of virtualizing hardware, containers only virtualize the OS; so all apps or containers are run by a single kernel this makes everything faster and more efficient.
we were able to pull Docker images, manage containers, and host a live NGINX web server accessible through localhost. We also discussed how AI is streamlining video game decompilation, which allows old console games to be recompiled directly for modern PCs rather than relying on heavy emulators.
# A diagram / Flow chart / Mind Map

### **Dockerfile** --> Docker build --> **Image** --> Docker run --> **Container**