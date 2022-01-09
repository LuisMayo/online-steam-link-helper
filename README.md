# Steam Link Helper
[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/S6S33O18T)
 Set of tools designed to aid in the process of playing steam link through the internet.
 
 This consists in 2 pieces of software.
 1. Messenger: Runs in a device inside the network that stays up at all times. It wakes up the steam play host and communicates with the steam agent. It serves a webpage that the end user can use to communicate with the system.
 2. Agent: Runs on the steam link host. Switches the logged Steam account.

## Getting Started

### Prerequisites
- Node.js with NPM

### Installing
1. Clone the project
``` bash
git clone https://github.com/LuisMayo/online-steam-link-helper.git
```

2. Get into the part of the project you want to deploy.
``` bash
cd agent # Agent should be run on the gaming PC
cd messenger # Messenger should be run on the insider device. Like a raspberry pi
```

3. Install the dependencies
``` bash
npm i
```

4. If you're running the mesenger, copy `config-example.json` into `config.json` and fill the details
``` bash
cp config-example.json config.json
nano config.json
```

5. Launch the project
``` bash
npm start
```

## Contributing
Since this is a tiny project we don't have strict rules about contributions. Just open a Pull Request to fix any of the project issues or any improvement you have percieved on your own. Any contributions which improve or fix the project will be accepted as long as they don't deviate too much from the project objectives. If you have doubts about whether the PR would be accepted or not you can open an issue before coding to ask for my opinion.
