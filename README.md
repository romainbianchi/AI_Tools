# AI Tools

This project is an interactive educational platform designed to introduce
**artificial intelligence concepts** through hands-on interaction with a
robot.

The system combines a **web interface**, a **Python backend for machine
learning**, and the **Thymio educational robot**

The application allows users to explore how machines make decisions by
controlling the robot using **decision trees**. The project provides two
different approaches to robot control:

- **Manual mode**, where users construct a decision tree themselves using a **drag-and-drop interface** to define the robot’s behavior.
- **AI mode**, where users collect training data and automatically generate a decision tree using a machine learning model.

By comparing these two approaches, users can better understand the
differences between **human-designed logical rules** and **data-driven
machine learning models**, while visualizing the decision process and
observing how it affects the robot’s behavior in the real world.

## Prerequisites

Before you begin, ensure you have installed the following on your system:

- Node.js (v18.18.2 or newer)
- yarn (1.22.21 or newer)

## Installation

To set up the project, follow these steps:

1. **Clone the repository:**

```bash
git clone https://github.com/romainbianchi/AI_Tools.git
cd AI_Tools
```

2. **Install dependencies:**
using Yarn:

```bash
yarn
```

3. **Running the Development Server:**

To start the development server with hot module replacement (HMR) enabled:

with Yarn:

```bash
yarn dev
```

This will start the Vite development server and you can view your application at `http://localhost:3000`.

## Acknowledgments

This project builds upon the **ThymioIA** project developed by **Mobsya**.

The original repository can be found here:
https://github.com/Mobsya/ThymioIA

Parts of the setup and project structure follow the original implementation.

This repository extends the original project to create an **interactive application for introducing artificial intelligence concepts**, with a focus on **decision trees and AI-based robot behaviors**.
