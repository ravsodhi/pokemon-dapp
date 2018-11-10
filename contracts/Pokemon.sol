pragma solidity ^0.4.24;

contract Pokemon
{
    uint public pokemonCount = 0;

    constructor
    ()
    public
    {
        _createPokemon("Pikachu", "Lightning", 2, 100);
        _createPokemon("Charizard", "Fire", 4, 200);
    }

    struct Pokemon
    {
        uint256 pokId; // Id for each unique pokemon
        string name;   // Name of the pokemon
        string pokType;   // monType of the pokemon -- "Fire, Earth, Water, Air, Lightning"
        uint64 level;  // Level for each pokemon
        uint64 exp;    // Experience acquired by a pokemon
        uint64 value;  // Value of the pokemon in some units
    }

    Pokemon[] public pokemons; // A list of ALL the pokemons in existence
    mapping(uint256 => address) public pokIndexToOwner; // The mapping defining the owner of specific pokemon
    mapping(address => uint256) pokemonOwned; // The number of pokemons owned by an address
    mapping(address => uint)    pendingReturns; // Storing the pending returns of some user
    mapping(address => uint256[])   ownedPoks;  // All the pokemons owned by an address

    // Events -- front end will update if it is listening to an event
    event Transferred(address _from, address _to, uint256 _pokId);
    event PokemonCreated(uint256 _pokId, string _name, uint64 _level, string _pokType, uint _value);

    /* Function to transfer pokemon from one address to another */
    function _transfer(address _from, address _to, uint256 _pokId)
    internal
    {
        uint i = 0;
        pokemonOwned[_to]++;
        pokIndexToOwner[_pokId] = _to;
        ownedPoks[_to].push(_pokId);

        /* When some user already owns the pokemon */
        if(_from != address(0)){
            pokemonOwned[_from]--;
            /* Deleting the pokemon from previous owner's array */
            for(i = 0;i < ownedPoks[_from].length; i++){
                if(ownedPoks[_from][i] == _pokId)
                    break;
            }
            ownedPoks[_from][i] = ownedPoks[_from][ownedPoks[_from].length - 1];
            delete ownedPoks[_from][ownedPoks[_from].length - 1];
            ownedPoks[_from].length--;
        }
        emit Transferred (_from, _to, _pokId);
    }

    /* Function to create pokemon */
    function _createPokemon(string _name, string _pokType, uint64 _level, uint64 _value)
    internal
    returns(uint256)
    {
        Pokemon memory _pokemon = Pokemon({
            pokId : pokemonCount,
            name : _name,
            pokType : _pokType,
            level : _level,
            exp : 0,
            value : _value
        });
        pokemonCount++;
        pokemons.push(_pokemon);
        emit PokemonCreated(pokemonCount, _name ,_level, _pokType, _value);
        return pokemonCount;
    }

    /* Function to catch pokemon's
       One needs to pay some amount to catch the pokemon
       Returns true if the pokemon is caught
       Else return's false
       */
    function catchPokemon(uint256 pokID)
    public
    //payable
    returns(bool)
    {
        require(pokIndexToOwner[pokID] == address(0), "This pokemon is already caught by someone");
        //require(pokemons[pokID].value <= msg.value, "Not supplied the required amount");
        _transfer(0, msg.sender, pokID);
        //pendingReturns[msg.sender] = msg.value - pokemons[pokID].value;
        return true;
    }

}
