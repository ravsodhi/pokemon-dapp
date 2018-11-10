App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',

  init: function() {
    return App.initWeb3();
  },

  initWeb3: function() {
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

  initContract: function() {
    $.getJSON("Pokemon.json", function(pokemon){
      // Instantiate a new truffle contract from the artifact
      App.contracts.Pokemon = TruffleContract(pokemon);
      // Connect provider to interact with contract
      App.contracts.Pokemon.setProvider(App.web3Provider);
      return App.render();
    });
  },

  render: function() {
    var pokemonInstance;
    var loader = $("#loader");
    var content = $("#content");

    loader.show();
    content.hide();
    // Load account data
    web3.eth.getCoinbase(function(err, account){
      if (err == null) {
        App.account = account;
        $("#accountAddress").html("Your Account: " + account);
      }
    });

    // Load contract data
    App.contracts.Pokemon.deployed().then(function(instance){
      pokemonInstance = instance;
      return pokemonInstance.pokemonCount();
    }).then(function(pokemonCount) {
      // var pokemonResults = $("#pokemonResults");
      // pokemonResults.empty();
      var pokemonRow = $('#pokemonRow');
      var pokemonTemplate = $('#pokemonTemplate');

      for(var i = 0; i <= pokemonCount; i++){
        pokemonInstance.pokemons(i).then(function(pokemon) {
          var monId = pokemon[0];
          var monName = pokemon[1];
          var monType = pokemon[2];
          var monLevel = pokemon[3];

          pokemonTemplate.find('.panel-title').text(monName);
          pokemonTemplate.find('img').attr('src', "images/"+monId+".jpg");
          pokemonTemplate.find('.pokemon-name').text(monName);
          pokemonTemplate.find('.pokemon-type').text(monType);
          pokemonTemplate.find('.pokemon-level').text(monLevel);
          pokemonTemplate.find('.btn-catch').attr('data-id', monId);
          pokemonRow.append(pokemonTemplate.html());
        });
      }

      loader.hide();
      content.show();
      // pokemonTemplate.show();
      // pokemonRow.show();
    }).catch(function(error) {
      console.warn(error);
    });
  },
    catchPok : function(data_id){
        var pokemonInstance;
        App.contracts.Pokemon.deployed().then(function(instance){
        pokemonInstance = instance;
        console.log(data_id);
        return pokemonInstance.catchPokemon(data_id);
        }).then(function(anything){
            console.log("lolololol");
            console.log(anything);
        }).catch(function(error){
            console.warn(error);
        }); 
    }
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
