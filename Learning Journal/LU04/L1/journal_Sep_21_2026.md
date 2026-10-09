# Unit CIS_114_01 - 26/FA 

# Lecture 
Date: Sep 21st 2026

## Hardware & Servers

## Rough outline of lecture
briefly reminded about AI safety, and how a war btwn the US and China was almost started because of fake intelligence produced by AI.
###    Projects were presented.


## key terms
Servers = "headless" computers (no monitors/keyboards, just computing power).
NPU (Neural Processing Unit) = GPU specifically for AI math
Motherboards & PCIe lanes: CPU connects to everything via lanes. Servers have way more lanes than consumer PCs.
RAM vs. Storage: RAM is super fast but volatile (clears when unplugged). Storage is permanent.
Drive types: NVMe (fastest, basically permanent RAM), SATA (cable limited), HDD (spinning metal, cheap for mass storage but slow).

## Direct Quote from Instructor


## Real-World Applications


## HUMAN written notes summarizing the lecture
We spoke about hardware basics, explaining how servers are essentially just headless computers living in closets. The most useful takeaway was understanding the hierarchy of storage, like why RAM is incredibly fast but volatile, while HDDs are just spinning "rust" that are good for cheap mass storage.
AI is software; it needs physical hardware to run.

# A diagram / Flow chart / Mind Map
[ COMPUTER HARDWARE ]
       |
       |-- CPU (The brain / math)
       |    |-- Connects to everything via PCIe lanes
       |
       |-- RAM / Memory
       |    |-- Extremely fast, but volatile (clears without power)
       |
       |-- Storage (Permanent)
       |    |-- NVMe (Fastest, connects directly to PCIe)
       |    |-- SATA SSD (Medium speed, limited by cables (connects to SAT controller and then to CPU))
       |    |-- HDD (Spinning rust, slow but cheap mass storage)
       |
       |-- Accelerators
            |-- GPU (Draws triangles/graphics)
            |-- NPU (Neural networks/AI math)
