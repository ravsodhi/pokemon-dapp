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
  fetchWildPokemons: function (pokId) {
    App.contracts.Pokemon.deployed().then(function (instance) {
      pokemonInstance = instance;
      return pokemonInstance.wildPokemonCount();
    }).then(function (pokemonCount) {
      // var pokemonResults = $("#pokemonResults");
      // pokemonResults.empty();
      var wildPokemonRow = $('#wildPokemonRow');
      var wildPokemonTemplate = $('#wildPokemonTemplate');
      for (var i = 0; i < pokemonCount.c[0]; i++) {
        pokemonInstance.wildPokemons(i).then(function (index) {
          pokemonInstance.pokemons(index).then(function (pokemon) {


            var monId = pokemon[0];
            var monName = pokemon[1];
            var monType = pokemon[2];
            var monLevel = pokemon[3];

            wildPokemonTemplate.find('.panel-title').text(monName);
            wildPokemonTemplate.find('img').attr('src', "images/" + monId.c[0] + ".jpg");
            wildPokemonTemplate.find('.pokemon-name').text(monName);
            wildPokemonTemplate.find('.pokemon-type').text(monType);
            wildPokemonTemplate.find('.pokemon-level').text(monLevel);
            wildPokemonTemplate.find('.btn-catch').attr('data-id', monId.c[0]);
            if (monId.c[0] == pokId) {
              wildPokemonRow.append(wildPokemonTemplate.html());
            }
          });
        });
      }
    }).catch(function (error) {
      console.warn(error);
    });
  },
  removeCaughtPokemons: function(pokId){
          var wildPokemonRow = $('#wildPokemonRow');
          wildPokemonRow.children("div").each(function(){
              var id = $(this).find('.btn-catch').attr('data-id');
              if(id == pokId){
                  this.remove();
              }
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
            var monId = pokemon[0];
            var monName = pokemon[1];
            var monType = pokemon[2];
            var monLevel = pokemon[3];

              console.log("maa k c", monId.c[0]);
            ownPokemonTemplate.find('.panel-title').text(monName);
            ownPokemonTemplate.find('img').attr('src', "images/" + monId.c[0] + ".jpg");
            ownPokemonTemplate.find('.pokemon-name').text(monName);
            ownPokemonTemplate.find('.pokemon-type').text(monType);
            ownPokemonTemplate.find('.pokemon-level').text(monLevel);
            ownPokemonTemplate.find('.btn-trade').attr('data-id', monId.c[0]);
            if (monId.c[0] == pokId) {
              ownPokemonRow.append(ownPokemonTemplate.html());
            }
          });
        });
      }
    }).catch(function (error) {
      console.warn(error);
    });
  },
  fetchTradePokemons: function(pokId){
    App.contracts.Pokemon.deployed().then(function(instance){
        pokemonInstance = instance;
        return pokemonInstance.ownedPoksCount(App.account);
    }).then(function (pokemonCount){
        var tradePokemonRow = $('#tradePokemonRow');
        var tradePokemonTemplate = $('#tradePokemonTemplate');
        for(var i = 0;i < pokemonCount.c[0]; i++){
            pokemonInstance.ownedPoks(App.account, i).then(function(index){
                pokemonInstance.pokemons(index).then(function(pokemon){
                    console.log(index);
                    var monId = pokemon[0];
                    var monName = pokemon[1];
                    var monType = pokemon[2];
                    var monLevel = pokemon[3];
                    tradePokemonTemplate.find('.panel-title').text(monName);
                    tradePokemonTemplate.find('img').attr('src', "images/" + monId + ".jpg");
                    tradePokemonTemplate.find('.pokemon-name').text(monName);
                    tradePokemonTemplate.find('.pokemon-type').text(monType);
                    tradePokemonTemplate.find('.pokemon-level').text(monLevel);
                    tradePokemonTemplate.find('.btn-buy').attr('data-id', monId);
                    console.log("chakka", pokemonCount.c[0]);
                    console.log("In trading function", monId.c[0], pokId);
                    if(monId.c[0] == pokId){
                        tradePokemonRow.append(tradePokemonTemplate.html());
                        console.log("Chal jaa bhai", monId.c[0], pokId);
                    }
                });
            });
        }
    }).catch(function(error){
        console.warn(error);
    });
  },

  catchPok: function (data_id) {
    var pokemonInstance;
    App.contracts.Pokemon.deployed().then(function (instance) {
      pokemonInstance = instance;
      console.log("Data:id ", data_id, App.account);
      return pokemonInstance.catchPokemon(data_id, {from: App.account, value: 200});
    }).then(function (anything) {
      console.log("lolololol");
      console.log(anything);
    }).catch(function (error) {
      console.warn(error);
    });
  },

  tradePok:function(data_id){
      var pokemonInstance;
      App.contracts.Pokemon.deployed().then(function(instance){
          pokemonInstance = instance;
          var price = prompt("Enter the Price for trade of this pokemon: ", "100");
          if(price == null || price == ""){
              ;
          }
          else{
              console.log("This is my price for the pokemon", price);
              console.log(data_id, App.account);
              pokemonInstance.allowTrading(price, data_id, {from: App.account});
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
        App.removeCaughtPokemons(event.args["_pokId"]);
        App.fetchOwnPokemons(event.args["_pokId"].c[0]);
        //location.reload();
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
        }).watch(function(error, event){
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
