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
  renderPokemons: function (pokId, pokemon, PokemonRow, PokemonTemplate, btn_category) {
    var monId = pokemon[0];
    var monName = pokemon[1];
    var monType = pokemon[2];
    var monLevel = pokemon[3];
    var monExp = pokemon[4];
    var monValue = pokemon[5];

    PokemonTemplate.find('.panel-title').text(monName);
    PokemonTemplate.find('img').attr('src', "images/" + monId.c[0] + ".jpg");
    PokemonTemplate.find('.panel-body').attr('pokemon-id', monId.c[0]);
    PokemonTemplate.find('.pokemon-name').text(monName);
    PokemonTemplate.find('.pokemon-type').text(monType);
    PokemonTemplate.find('.pokemon-level').text(monLevel);
    PokemonTemplate.find('.pokemon-value').text(monValue);
    PokemonTemplate.find('.btn-'.concat(btn_category)).attr('data-id', monId.c[0]);
    if (monId.c[0] == pokId) {
      PokemonRow.append(PokemonTemplate.html());
    }
  },
  fetchWildPokemons: function (pokId) {
    App.contracts.Pokemon.deployed().then(function (instance) {
      pokemonInstance = instance;
      return pokemonInstance.wildPokemonCount();
    }).then(function (pokemonCount) {
      var wildPokemonRow = $('#wildPokemonRow');
      var wildPokemonTemplate = $('#wildPokemonTemplate');
      for (var i = 0; i < pokemonCount.c[0]; i++) {
        pokemonInstance.wildPokemons(i).then(function (index) {
          pokemonInstance.pokemons(index).then(function (pokemon) {
            App.renderPokemons(pokId, pokemon, wildPokemonRow, wildPokemonTemplate, 'catch');
          });
        });
      }
    }).catch(function (error) {
      console.warn(error);
    });
  },
  fetchOwnPokemons: function (pokId) {
    App.contracts.Pokemon.deployed().then(function (instance) {
      pokemonInstance = instance;
      console.log(App.account);
      return pokemonInstance.ownedPoksCount(App.account);
    }).then(function (pokemonCount) {
      var ownPokemonRow = $('#ownPokemonRow');
      var ownPokemonTemplate = $('#ownPokemonTemplate');
      for (var i = 0; i < pokemonCount.c[0]; i++) {
        pokemonInstance.ownedPoks(App.account, i).then(function (index) {
          pokemonInstance.pokemons(index).then(function (pokemon) {
            App.renderPokemons(pokId, pokemon, ownPokemonRow, ownPokemonTemplate, 'trade');
          });
        });
      }
    }).catch(function (error) {
      console.warn(error);
    });
  },
  fetchTradePokemons: function (pokId) {
    App.contracts.Pokemon.deployed().then(function (instance) {
      pokemonInstance = instance;
      return pokemonInstance.ownedPoksCount(App.account);
    }).then(function (pokemonCount) {
      var tradePokemonRow = $('#tradePokemonRow');
      var tradePokemonTemplate = $('#tradePokemonTemplate');
      for (var i = 0; i < pokemonCount.c[0]; i++) {
        pokemonInstance.ownedPoks(App.account, i).then(function (index) {
          pokemonInstance.pokemons(index).then(function (pokemon) {
            App.renderPokemons(pokId, pokemon, tradePokemonRow, tradePokemonTemplate, 'buy');
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
      return pokemonInstance.pokemons(data_id);
    }).then(function (pokemon) {
      pokValue = pokemon[5];
      return pokemonInstance.catchPokemon(data_id, { from: App.account, value: pokValue });
    }).catch(function (error) {
      console.warn(error);
      console.log(value);
      // var x = $("[pokemon-id="+data_id+"]").html();
      // console.log(x);
      // console.log(data_id);
      // return pokemonInstance.catchPokemon(data_id, { from: App.account, value: 200 });
    });
  },

  tradePok: function (data_id) {
    var pokemonInstance;
    App.contracts.Pokemon.deployed().then(function (instance) {
      pokemonInstance = instance;
      var price = prompt("Enter the Price for trade of this pokemon: ", "100");
      if (price == null || price == "") {
        ;
      }
      else {
        console.log("This is my price for the pokemon", price);
        console.log(data_id, App.account);
        pokemonInstance.allowTrading(price, data_id, { from: App.account });
      }
    });
  },

  /* Reload when the count of pokemon row in html is now equal to then pokemon's owned in contract */
  ReloadOnCountNotCorrect() {
    App.contracts.Pokemon.deployed().then(function (instance) {
      pokemonInstance = instance;
      return pokemonInstance.wildPokemonCount();
    }).then(function (pokemonCount) {
      var wildPokemonRowLength = $('#wildPokemonRow > div').length;
      if (pokemonCount.c[0] < wildPokemonRowLength) {
        location.reload();
      }
    });

  },

  listenForEvents: function () {
    App.contracts.Pokemon.deployed().then(function (instance) {
      instance.Transferred({}, {
        fromBlock: 0,
        toBlock: 'latest'
      }).watch(function (error, event) {
        console.log("Pokemon Transferred", event)
        App.fetchOwnPokemons(event.args["_pokId"].c[0]);
        App.ReloadOnCountNotCorrect();
      });
      instance.PokemonCreated({}, {
        fromBlock: 0,
        toBlock: 'latest'
      }).watch(function (error, event) {
        console.log("Pokemon Created", event)
        console.log(event.args["_pokId"].c[0]);
        App.fetchWildPokemons(event.args["_pokId"].c[0]);
        //App.render();
      });
      instance.TradingTurnedOn({}, {
        fromBlock: 0,
        toBlock: 'latest'
      }).watch(function (error, event) {
        console.log("Pokemon's trading turned on", event);
        App.fetchTradePokemons(event.args["_pokId"].c[0]);
      });
    });
  }
};

$(function () {
  $(window).load(function () {
    App.init();
  });
});
