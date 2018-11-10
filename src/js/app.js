App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',

  init: function () {
    return App.initWeb3();
  },

  initWeb3: function () {
    if (typeof web3 !== 'undefined') {
      // If a web3 instance is already provided by Meta Mask.
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider);
    } else {
      // Specify default instance if no web3 instance provided
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:8545');
      web3 = new Web3(App.web3Provider);
    }
    return App.initContract();
  },

  initContract: function () {
    $.getJSON("Pokemon.json", function (pokemon) {
      // Instantiate a new truffle contract from the artifact
      App.contracts.Pokemon = TruffleContract(pokemon);
      // Connect provider to interact with contract
      App.contracts.Pokemon.setProvider(App.web3Provider);
      App.listenForEvents();
      // App.fetchWildPokemons();
      // App.fetchOwnPokemons();
      return App.render();
    });
  },

  render: function () {
    var loader = $("#loader");
    var content = $("#content");

    loader.show();
    content.hide();
    // Load account data
    web3.eth.getCoinbase(function (err, account) {
      if (err == null) {
        App.account = account;
        $("#accountAddress").html("Your Account: " + account);
      }
    });
    // Load contract data
    loader.hide();
    content.show();

    // pokemonTemplate.show();
    // pokemonRow.show();

  },
  fetchWildPokemons: function () {
    App.contracts.Pokemon.deployed().then(function (instance) {
      pokemonInstance = instance;
      return pokemonInstance.wildPokemonCount();
    }).then(function (pokemonCount) {
      // var pokemonResults = $("#pokemonResults");
      // pokemonResults.empty();
      console.log(pokemonCount.c[0]);
      var wildPokemonRow = $('#wildPokemonRow');
      var pokemonTemplate = $('#pokemonTemplate');
      wildPokemonRow.html(pokemonTemplate);
      for (var i = 0; i < pokemonCount.c[0]; i++) {
        pokemonInstance.wildPokemons(i).then(function (index) {
          pokemonInstance.pokemons(index).then(function (pokemon) {

            var monId = pokemon[0];
            var monName = pokemon[1];
            var monType = pokemon[2];
            var monLevel = pokemon[3];

            pokemonTemplate.find('.panel-title').text(monName);
            pokemonTemplate.find('img').attr('src', "images/" + monId + ".jpg");
            pokemonTemplate.find('.pokemon-name').text(monName);
            pokemonTemplate.find('.pokemon-type').text(monType);
            pokemonTemplate.find('.pokemon-level').text(monLevel);
            pokemonTemplate.find('.btn-catch').attr('data-id', monId);
            wildPokemonRow.append(pokemonTemplate.html());
          });
        });
      }
    }).catch(function (error) {
      console.warn(error);
    });
  },
  fetchOwnPokemons: function () {
    App.contracts.Pokemon.deployed().then(function (instance) {
      pokemonInstance = instance;
      console.log(App.account);
      return pokemonInstance.ownedPoksCount(App.account);
    }).then(function (pokemonCount) {
      var ownPokemonRow = $('#ownPokemonRow');
      var pokemonTemplate = $('#pokemonTemplate');
      ownPokemonRow.empty();
      for (var i = 0; i < pokemonCount.c[0]; i++) {
        pokemonInstance.ownedPoks(App.account, i).then(function (index) {
          pokemonInstance.pokemons(index).then(function (pokemon) {

            var monId = pokemon[0];
            var monName = pokemon[1];
            var monType = pokemon[2];
            var monLevel = pokemon[3];

            pokemonTemplate.find('.panel-title').text(monName);
            pokemonTemplate.find('img').attr('src', "images/" + monId + ".jpg");
            pokemonTemplate.find('.pokemon-name').text(monName);
            pokemonTemplate.find('.pokemon-type').text(monType);
            pokemonTemplate.find('.pokemon-level').text(monLevel);
            pokemonTemplate.find('.btn-catch').attr('data-id', monId);
            ownPokemonRow.append(pokemonTemplate.html());
          });
        });
      }
    }).catch(function (error) {
      console.warn(error);
    });
  },
  catchPok: function (data_id) {
    var pokemonInstance;
    App.contracts.Pokemon.deployed().then(function (instance) {
      pokemonInstance = instance;
      console.log(data_id);
      return pokemonInstance.catchPokemon(data_id);
    }).then(function (anything) {
      console.log("lolololol");
      console.log(anything);
    }).catch(function (error) {
      console.warn(error);
    });
  },
  listenForEvents: function () {
    App.contracts.Pokemon.deployed().then(function (instance) {
      instance.Transferred({}, {
        fromBlock: 0,
        toBlock: 'latest'
      }).watch(function (error, event) {
        console.log("Pokemon Transferred", event)
        App.fetchWildPokemons();
        App.fetchOwnPokemons();
        // App.render();
      });
      instance.PokemonCreated({}, {
        fromBlock: 0,
        toBlock: 'latest'
      }).watch(function (error, event) {
        console.log("Pokemon Created", event)
        App.fetchWildPokemons();
        // App.render();
      });
    });
  }
};

$(function () {
  $(window).load(function () {
    App.init();
  });
});
