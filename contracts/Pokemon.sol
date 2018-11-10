pragma solidity ^0.4.24;

contract Pokemon
{
    uint public pokemonCount = 0;

    constructor
    ()
    public
    {
        _createPokemon("Pikachu", "Lightning", 2);
        _createPokemon("Charizard", "Fire", 4);
    }

    struct Pokemon
    {
        uint256 monId; // Id for each unique pokemon
        string name;   // Name of the pokemon
        string monType;   // monType of the pokemon -- "Fire, Earth, Water, Air, Lightning"
        uint64 level;  // Level for each pokemon
        uint64 exp;    // Experience acquired by a pokemon
    }

    Pokemon[] public pokemons; // A list of ALL the pokemons in existence
    mapping(uint256 => address) public monIndexToOwner; // The mapping defining the owner of specific pokemon
    mapping(address => uint256) pokemonOwned; // The number of pokemons owned by an address

    // Events -- front end will update if it is listening to an event
    event Transferred(address _from, address _to, uint256 _monId);
    event PokemonCreated(uint256 _monId, string _name, uint64 _level, string _monType);

    /* Function to transfer pokemon from one address to another */
    function _transfer(address _from, address _to, uint256 _monId)
    internal
    {
        pokemonOwned[_to]++;
        monIndexToOwner[_monId] = _to;

        pokemonOwned[_from]--;
        emit Transferred (_from, _to, _monId);
    }

    /* Function to create pokemon */
    function _createPokemon(string _name, string _monType, uint64 _level)
    internal
    returns(uint256)
    {
        pokemonCount++;
        Pokemon memory _pokemon = Pokemon({
            monId : pokemonCount,
            name : _name,
            monType : _monType,
            level : _level,
            exp : 0
        });

        pokemons.push(_pokemon);
        emit PokemonCreated(pokemonCount, _name ,_level, _monType);
        return pokemonCount;
    }
}