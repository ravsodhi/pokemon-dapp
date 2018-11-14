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
    App.displayPendingReturns();
    // Load contract data
    loader.hide();
    content.show();

    // pokemonTemplate.show();
    // pokemonRow.show();

  },
  renderPokemons: function (pokId, pokemon, PokemonRow, PokemonTemplate, btn_category, btn_disabled, btn_category2) {
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
    if(btn_disabled == true){
      PokemonTemplate.find('.btn-'.concat(btn_category)).html("Own Back");
      PokemonTemplate.find('.btn-'.concat(btn_category)).attr('onclick', "App.disableTrade(this.getAttribute('data-id'));");
    }
    else{
      PokemonTemplate.find('.btn-'.concat(btn_category)).html(btn_category);
      if(btn_category === 'buy' )
          PokemonTemplate.find('.btn-'.concat(btn_category)).attr('onclick', "App.buyPokFromTradeMarket(this.getAttribute('data-id'));");
      else if(btn_category === 'catch')
          PokemonTemplate.find('.btn-'.concat(btn_category)).attr('onclick', "App.catchPok(this.getAttribute('data-id'));");
      else if(btn_category === 'trade')
          PokemonTemplate.find('.btn-'.concat(btn_category)).attr('onclick', "App.tradePok(this.getAttribute('data-id'));");
      if(btn_category2 ==='train'){
        PokemonTemplate.find('.btn-'.concat(btn_category2)).attr('data-id', monId.c[0]);
        PokemonTemplate.find('.btn-'.concat(btn_category2)).attr('onclick', "App.trainPok(this.getAttribute('data-id'));");
      }
    }
    if (monId.c[0] == pokId) {
      PokemonRow.append(PokemonTemplate.html());
    }
  },
  fetchWildPokemons: function (pokId, txnHash) {
    App.contracts.Pokemon.deployed().then(function (instance) {
      var wildPokemonRow = $('#wildPokemonRow');
      var wildPokemonTemplate = $('#wildPokemonTemplate');
      pokemonInstance = instance;
      pokemonInstance.pokemonTransactionHash(pokId).then(function (realHash){
       console.log(realHash, txnHash);
      if(realHash.c[0] != txnHash){
          return;
      }
      pokemonInstance.pokIndexToOwner(pokId).then(function(address){
          if(address == 0){
              pokemonInstance.pokemons(pokId).then(function (pokemon) {
                App.renderPokemons(pokId, pokemon, wildPokemonRow, wildPokemonTemplate, 'catch', false, '');
              });
          }
      });
      });
    }).catch(function (error) {
      console.warn(error);
    });
  },
    fetchOwnPokemons: function (pokId, txnHash) {
    App.contracts.Pokemon.deployed().then(function (instance) {
      pokemonInstance = instance;
      return pokemonInstance.ownedPoksCount(App.account);
    }).then(function (pokemonCount) {
      pokemonInstance.pokemonTransactionHash(pokId).then(function (realHash){   // Checking if this transaction is the latest for this pokemon
      if(realHash.c[0] != txnHash){
          return;
      }
      var ownPokemonRow = $('#ownPokemonRow');
      var ownPokemonTemplate = $('#ownPokemonTemplate');
      for (var i = 0; i < pokemonCount.c[0]; i++) {
        pokemonInstance.ownedPoks(App.account, i).then(function (index) {
          pokemonInstance.pokemons(index).then(function (pokemon) {
            pokemonInstance.tradePokemons(pokId).then(function (is_in_trade) {
                if(is_in_trade.c[0] == 0)
                    pokemonInstance.tradeTime(pokId).then(function (till_time){
                        App.renderPokemons(pokId, pokemon, ownPokemonRow, ownPokemonTemplate, 'trade', false, 'train');
                        var last_chld = ownPokemonRow.find(`[data-id='${pokId}']`);
                        if(till_time.c[0] > ($.now()/1000)){
                            last_chld[0].disabled = true;
                            last_chld[1].disabled = true;
                        }
                        else{
                            last_chld[0].disabled = false;
                            last_chld[1].disabled = false;
                        }
                });
            });
          });
        });
      }
      });
    }).catch(function (error) {
      console.warn(error);
    });
},
  fetchTradePokemons: function (pokId, txnHash) {
    App.contracts.Pokemon.deployed().then(function (instance) {
      pokemonInstance = instance;
      var tradePokemonRow = $('#tradePokemonRow');
      var tradePokemonTemplate = $('#tradePokemonTemplate');
      pokemonInstance.pokemonTransactionHash(pokId).then(function (realHash){   // Checking if this transaction is the latest for this pokemon
      if(realHash.c[0] != txnHash){
          return;
      }
      pokemonInstance.pokemons(pokId).then(function (pokemon){
          pokemonInstance.tradePokemons(pokId).then(function (is_it_tradable){
            if(is_it_tradable.c[0] == 1){   // Checking if the pokemon is still tradable
                var button_disabled = false;
                pokemonInstance.pokIndexToOwner(pokId).then(function(owner){
                if(owner == App.account){
                    button_disabled = true;
                }
                console.log(owner, App.account, button_disabled);
                App.renderPokemons(pokId, pokemon, tradePokemonRow, tradePokemonTemplate, 'buy', button_disabled, '');
            });
           }
          });
        });
        });
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
    });
  },

  tradePok: function (data_id) {
    var pokemonInstance;
    App.contracts.Pokemon.deployed().then(function (instance) {
      pokemonInstance = instance;
      pokemonInstance.pokemons(data_id).then(function (pokemon){
          var price = prompt("Enter the Price for trade of this pokemon: ", pokemon[5]);
          if (price == null || price == "") {
            ;
          }
          else {
            console.log("This is my price for the pokemon", price);
            console.log(data_id, App.account);
            pokemonInstance.allowTrading(price, data_id, { from: App.account });
          }
      });
    });
  },

  trainPok: function (data_id) {
    var pokemonInstance;
    App.contracts.Pokemon.deployed().then(function (instance) {
      pokemonInstance = instance;
      pokemonInstance.pokemons(data_id).then(function (pokemon){
        pokemonInstance.pokIndexToOwner(data_id).then(function (address){
            console.log("lets see", address, App.account);
            console.log("PokeId: ", data_id);
            pokemonInstance.trainPokemon(data_id, {from: App.account}).then(function (){
                location.reload();
            });
        });
      }).catch(function(error){
          console.warn(error);
      });
    }).catch(function(error){
        console.warn(error);
    });
    console.log("I am here, okay?");
    // location.reload();
  },
  
  buyPokFromTradeMarket: function(data_id) {
    var pokemonInstance;
    App.contracts.Pokemon.deployed().then(function (instance) {
        pokemonInstance = instance;
        pokemonInstance.pokemons(data_id).then(function (pokemon){
            var pokValue = pokemon[5];
            pokemonInstance.buyFromTradeMarket(data_id, {from: App.account, value: pokValue});
        });
    }).catch(function(error){
        console.warn(error);
    });
  },
  disableTrade: function(data_id) {
    var pokemonInstance;
    App.contracts.Pokemon.deployed().then(function (instance) {
        pokemonInstance = instance;
        pokemonInstance.disableTrade(data_id, {from: App.account});
    });
  },

  /* Reload when the count of pokemon row in html is now equal to then pokemon's owned in contract */
  ReloadOnOwnCountNotCorrect() {
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

   ReloadOnTradeCountNotCorrect() {
       App.contracts.Pokemon.deployed().then(function (instance){
           pokemonInstance = instance;
           return pokemonInstance.ownedPoksCount(App.account);
       }).then(function(totalOwnCount){
           pokemonInstance.tradePoksCount(App.account).then(function (tradeCount){
               var ownPokemonRowLength = $('#ownPokemonRow > div').length;
               if((totalOwnCount.c[0] - tradeCount.c[0]) < ownPokemonRowLength){    // If the non-tradable owned pokemons are less than what is displayed, reload
                   location.reload();
               }
           });
       }).catch(function(error){
           console.warn(error);
       });
   },
   ReloadOnTradeMarketCountNotCorrect() {
        App.contracts.Pokemon.deployed().then(function (instance){
            pokemonInstance = instance;
            return pokemonInstance.tradePokemonCount();
        }).then(function(tradePokCount){
            var tradePokemonRowLength = $('#tradePokemonRow > div').length;
            if(tradePokCount < tradePokemonRowLength){
                location.reload();
            }
        });
   },

   displayPendingReturns: function() {
    App.contracts.Pokemon.deployed().then(function (instance){
        pokemonInstance = instance;
        return pokemonInstance.pendingReturns(App.account);
    }).then(function (my_money){
        console.log("I am here");
        var wallet = $('#walletBallance').html("Wallet Ballance: " + my_money.c[0]);
    }).catch(function (error){
        console.warn(error);
    });
   },

   getPendingReturns: function() {
       App.contracts.Pokemon.deployed().then(function (instance){
           pokemonInstance = instance;
           pokemonInstance.withdraw({from: App.account}).then(function (){
                App.displayPendingReturns();
           });
       });
   },

  listenForEvents: function () {
    App.contracts.Pokemon.deployed().then(function (instance) {
      instance.Transferred({}, {
        fromBlock: 0,
        toBlock: 'latest'
      }).watch(function (error, event) {
        console.log("Pokemon Transferred", event)
        App.fetchOwnPokemons(event.args["_pokId"].c[0], event.args["txnHash"].c[0]);
        App.ReloadOnOwnCountNotCorrect();
        App.ReloadOnTradeMarketCountNotCorrect();
        App.displayPendingReturns();
      });
      instance.PokemonCreated({}, {
        fromBlock: 0,
        toBlock: 'latest'
      }).watch(function (error, event) {
        console.log("Pokemon Created", event)
        console.log(event.args["_pokId"].c[0]);
        App.fetchWildPokemons(event.args["_pokId"].c[0], event.args["txnHash"].c[0]);
      });
      instance.TradingTurnedOn({}, {
        fromBlock: 0,
        toBlock: 'latest'
      }).watch(function (error, event) {
        console.log("Pokemon's trading turned on", event);
        App.fetchTradePokemons(event.args["_pokId"].c[0], event.args["txnHash"].c[0]);
        App.ReloadOnTradeCountNotCorrect();
      });
      instance.TradingTurnedOff({}, {
          fromBlock: 0,
          toBlock: 'latest'
      }).watch(function (error, event) {
          console.log("Pokemon's trading turned off", event);
          App.fetchOwnPokemons(event.args["_pokId"].c[0], event.args["txnHash"].c[0]);
          App.ReloadOnTradeMarketCountNotCorrect();
      });
      // Instance.TrainingTurnedOn({}, {
      //   fromBlock: 0,
      //   toBlock: 'latest'
      // }).watch(function (error, event) {
      //   App.fetchOwnPo
      // })
    });
  }
};

$(function () {
  $(window).load(function () {
    App.init();
  });
});
