# BattleDrome Core Project
This is the BattleDrome platform core project, including the back-end game engine contracts, and the front-end web interface/DApp.

Note, this documentation is targeted for Developers. For end-user documentation please consult the official BattleDrome Core Wiki at: https://github.com/BattleDrome/Core/wiki

It is currently built using the Truffle Framework.

WARNING: This documentation may be slightly out of date from current process. Revision coming soon.

## Table of Contents
1. [Dev Env Setup](#setup-of-dev-environment)
2. [Dev Guide](#development-guide)
3. [Testing](#testing)

## Setup of Dev Environment
### On Windows:
- Install VS Code Latest: https://code.visualstudio.com/
- Install “Solidity Extended” extension
- Install Bash on Linux Subsystem (Ubuntu)
- Install Ganache UI: http://truffleframework.com/ganache/

### Linux (ubuntu based, or Linux Subsystem on windows)
**Setup Pre-reqs:**
```
sudo apt-get install git
curl -sL https://deb.nodesource.com/setup_9.x | sudo -E bash -
sudo apt-get install nodejs
sudo npm install -g npm
```
**Install Truffle:**
```
sudo npm install -g truffle
```

### Linux (Fedora, CentOS, etc.)
```
sudo yum install nodejs
```
**Install Truffle:**
```
sudo npm install -g truffle
```

### Browser Environment
1. Install Metamask Chrome Plugin
2. In Metamask choose `Import from Existing Den`
3. Make sure Ganache is running
3. Paste in the default ganache mnemonic: `candy maple cake sugar pudding cream honey rich smooth crumble sweet treat` (note: this may change, check Ganache UI if it matches, if not, use whatever is shown in Ganache)
4. Choose any password (not important that it's secure, it's for dev only, only important that you remember it)
5. Once Metamask shows "Account 1" you can drop down where it shows Main Network and choose "Custom RPC"
6. Input `http://localhost:7545` into the RPC URL field (to talk to Ganache)
7. Now when you open MetaMask Account 1 should show a balance of 100 ETH.
8. You can add several accounts by clicking the icon representing a user, with 2 circular arrows in the top right of MetaMask, and choosing Create Account. This will generate additional accounts with addresses that match those in the Ganache environment. This is useful to test from various user's perspectives

## Development Guide
Please follow the below guidelines for development

### Branching Strategy
- Each "Feature" should get a new branch from "develop" branch. From Dev Env `git checkout -b new_feature origin/develop`
- Develop within the branch. Commit frequently and push after each commit.
- When feature is "done" merge back into develop.
    - Checkout develop: `git checkout develop`
    - Merge: `git merge new_feature --no-ff`
    - Push: `git push` (note conflict resolution may be needed, pull, manual merge, etc)
- Develop should run CI jobs with unit tests etc on commit
- When ready for some kind of release, code review, then merge back to "master" branch
- Tag each release
- Tagged releases trigger CI build/test as well as (eventually) deploy.

### Using Ganache

The development network in the project config targets Ganache as a blockchain. This requires you have Ganache installed and running for any development or testing.

Note: Each time you restart Ganache, it results in a clean blockchain. This means you start 100% from scratch. All data is lost. If you want to persist data, you must leave Ganache running.

If you reset Ganache, you must also reset the account in Metamask, as it's transaction Nonce will get out of sync, resulting in transactions failing. This can be done by going to the settings menu in Metamask and choosing "Reset Account"

### Using Truffle

The truffle development environment can work in "Develop" mode, where everything (including blockchain simulation) is simulated within the truffle CLI. Or it can work with individual commands operating on a "Network" (defined in the truffle.js config file).

We have defined a default "Development" network in the truffle config which targets a locally running Ganache UI based blockchain. All development/testing should be done using the base truffle commands from outside the develop REPL in order for it to default to the Develop network. If you run `truffle develop` it will force to the internal network (which runs an embedded version of ganache cli which is slightly different than the official ganache version). This is used primarily for testing/migration support on the docker container for automated build/test in our CI/CD pipelines on Gitlab.

In "Develop" mode, the network is forced to be internal.

Truffle has several commands that can be used in development, testing, and debugging:
- `compile`
  - Compiles all solidity code into binary, and builds the json truffle contract objects
  - Supports the `--all` flag which tells it to recompile all files (not just changed files)
- `migrate` 
  - Runs the migration scripts, deploying the contracts, and initializing them on the blockchain (depending on the chosen network)
  - Supports the `--reset` flag which will re-migrate everything regardless of change tracking
- `test` 
  - Runs all unit tests
  - Supports specification of a particular test script file to run if you wish such as `test ./test/TestWarriorCore.js`
- `debug [txid]` 
  - Initiates the debugger console, which lets you debug the EVM execution of a transaction by it's hash/id

Note that all of these commands support specifying a network to run on, based on the network name in the truffle.js config file. You can have any number of networks defined, and truffle will manage them individually. For now we only have the one "develop" network defined which targets a locally running Ganache instance.

Usually you will run truffle commands from the main shell using `truffle [command] [args/params]` which will invoke the appropriate command, and allow you to pass parameters etc.
If you don't specify a network, it will default to "develop"

If for some reason you are running truffle in "develop" mode by running `truffle develop` from the CLI, you enter into a REPL, where you can directly execute truffle commands or javascript. In this case you can ommit the "truffle" part of commands so you can run compile for example simply by typing `compile [args]` instead of `truffle compile [args]`

It should also be noted that the default port that the JSON RPC is served for the blockchain is 8545 on most Ethereum clients, while Ganache serves on 7545 and `truffle develop` has an internal ganache-cli that serves on 9545.

In the future we will likely configure additional "Networks", such as "test", or "prod" (these would for example be a local blockchain simulator, the testnet, and the production mainnet). In the config you provide the JSON-RPC config for truffle to use to talk to the network being defined, along with a few other parameters.

Here is a list of some example common truffle commands. Note I'm leaving off the "truffle" part. So run these either by using `truffle [command]` or by using `truffle develop` and then simply `[command]` at the truffle develop prompt.

- To compile: `compile`
- To force recompile of all code `compile --all`
- To Deploy: `migrate`
- To Reset (overwrite) Deployments: `migrate --reset`
- To Run Unit Tests: `test`
- To Debug a specific transaction from it's transaction ID: `debug [txid]` and follow the prompts
- To exist from the truffle CLI `.exit`

### CI/CD (Continuous Integration/Continuous Delivery)

CI/CD is configured on this project, commits will automatically fire truffle compile, migrate and test using the ganache-cli blockchain.

Currently the following pipeline runs on every commit:

compile -> migrate -> test

For any commit to the `develop` branch, the following additional stages run:

deploy_compile -> dev_web_deploy

For any commit to the `master` branch, the following stages run:

deploy_compile -> prod_web_deploy -> prod_contract_deploy

These pipelines aren't all complete yet, for now the dev deployment, and regular testing pipelines work fine. Future development will continue to flesh these out, and this documentation will be updated to reflect.

## Testing

For testing, follow the development setup guide above to setup your environment. Using the dev environment, you'll want to have Ganache running, and have run the compile and migrate (to deploy the contracts to your local Ganache blockchain). Then you'll need a browser with metamask installed (As per development setup instructions)

Testing plans, details, etc to follow in documentation later.


Further CI/CD pipelines for app deployment, and documentation generation coming soon.
