# Unit CIS_114_01 - 26/FA 

# Lecture 
Date: Sep 22nd 2026

## Virtualization & Hypervisors

## keyterms
Virtual Machine (VM): A software-based computer inside a physical one.
Hypervisors: Software that pulls resources from the host to run the VM.
Type 1 Hypervisor (Bare Metal): Installs straight onto hardware. Super fast, used by data centers and cloud servers.
Type 2 Hypervisor (Hosted): Runs on top of a normal OS (like Windows). We are using this (VirtualBox). Downside is the host OS eats up RAM in the background.
Sandboxing: VMs are isolated. They can't break out into the host PC.

## Rough outline of lecture
What is a Virtual Machine (VM)? A software-based computer inside a physical one.
configured our VMs, had to download Debian

## Direct Quote from Instructor
"i dont know how microsoft screws up everything" which is absolutely true.

## Real-World Applications
It is important to know how to use VM's and sandboxes, "security is everyones responsibility."
## HUMAN written notes summarizing the lecture
focused on virtualization, getting our own Debian VMs up and running in VirtualBox. 
We learned the difference between Type 1 bare-metal hypervisors used in big data centers and the Type 2 hosted ones we are actively using on our personal laptops.
I ended up dedicating about 8 gigs of RAM and a 60GB virtual drive to my setup, mistakenly forgot to leave out a desktop environment so that it should have booted straight to a lightweight terminal

# A diagram / Flow chart / Mind Map
