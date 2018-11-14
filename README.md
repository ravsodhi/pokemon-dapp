# PokemonDapp
A decentralized pokemon game involving catching Pokemon, trading/raising of Pokemon on the blockchain.

## Instructions

```
npm install
truffle migrate --reset
npm run dev
```
This should open a browser window with the client-side of the application.
Other commands:
```
truffle compile
truffle migrate
truffle test
```
## Description and Working
Our game is a simplistic version of [Etheremon](https://www.etheremon.com/) which allows capture, training, transforming, and trading monsters/pokemons.

A set of pokemons are in the 'wild' i.e they can be captured by anyone for some gas, and can be removed after a period of time. After that, that specific pokemon may only be available on the trade market, in which players can trade pokemons amongst themselves.
Once a pokemon has been caught by a player, it belongs to that particular players set of owned pokemons. Here, the player can train/raise the pokemon. Training essentially means increasing the power of the pokemon (increaseing experience). Increasing experiences increases the value of the pokemon on the market and a more experienced pokemon is more likely to win battles against other pokemons.
While the pokemon is being trained, the player cannot use the pokemon anywhere else. After training is complete, the experience of the pokemon increases. After the pokemon has enough experience points, the pokemon can upgrade. After the training has finished, there is a cooldown period specific to each pokemon, before the pokemon can be trained again. Rare pokemons can have low cooldown periods and may be highly valued accordingly.
