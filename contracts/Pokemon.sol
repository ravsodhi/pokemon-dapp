pragma solidity ^0.4.24;

contract Pokemon
{
    string public testString;

    constructor()
    {
        testString = "test";
    }

    struct Pokemon
    {
        uint256 monId; // Id for each unique pokemon
        uint64 level;  // Level for each pokemon
        uint64 exp;    // Experience acquired by a pokemon
    }

    Pokemon[] pokemons; // A list of ALL the pokemons in existence
    mapping(uint256 => address) public monIndexToOwner; // The mapping defining the owner of specific pokemon
    mapping(address => uint256) pokemonOwned; // The number of pokemons owned by an address

    // Events -- front end will update if it is listening to an event
    event Transferred(address _from, address _to, uint256 _monId);
    event PokemonCreated(uint256 _monId, uint64 _level, uint64 _exp);

    /* Function to transfer pokemon from one address to another */
    function _transfer(address _from, address _to, uint256 _monId)
    internal
    {
        pokemonOwned[_to]++;
        monIndexToOwner[_monId] = _to;

        pokemonOwned[_from]--;
        emit Transferred(_from, _to, _monId);
    }

    /* Function to create pokemon */
    function _createPokemon(uint256 _monId, uint64 _level, uint64 _exp)
    internal
    returns(uint256)
    {
        Pokemon memory _pokemon = Pokemon({
            monId : _monId,
            level : _level,
            exp : _exp
        });

        pokemons.push(_pokemon);
        emit PokemonCreated(_monId, _level, _exp);
        return _monId;
    }

}