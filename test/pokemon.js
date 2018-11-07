var Pokemon = artifacts.require("./Pokemon.sol");

contract("Pokemon", function(accounts){
    var pokemonInstance;

    it("Initialize the contract", function(){
        return Pokemon.deployed().then(function(instance){
            return  instance.testString();
        }).then(function(testStr){
            assert.equal(testStr, "test");
        });
    });
})