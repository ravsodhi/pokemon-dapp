var Pokemon = artifacts.require("./Pokemon.sol");

module.exports = function(deployer)
{
    deployer.deploy(Pokemon)
}