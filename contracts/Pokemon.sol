pragma solidity ^0.4.24;

contract Pokemon
{
    uint public pokemonCount = 0;
    uint public wildPokemonCount = 0;

    constructor
    ()
    public
    {
        _createPokemon("Pikachu", "Lightning", 2, 100);
        _createPokemon("Charizard", "Fire", 4, 200);
        _createPokemon("Snorlax", "Earth", 3, 50);
        _createPokemon("Magikarp", "Water",1, 25);
        _createPokemon("Onyx", "Earth", 4, 150);
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
    uint256[] public wildPokemons;
    mapping(uint256 => uint) tradePokemons; // 1 if a pokemon is tradeble, otherwise 0
    mapping(uint256 => address) public pokIndexToOwner; // The mapping defining the owner of specific pokemon
    mapping(address => uint)    pendingReturns; // Storing the pending returns of some user
    mapping(address => uint256[]) public ownedPoks;  // All the pokemons owned by an address
    mapping(address => uint256) public ownedPoksCount; // The number of pokemons owned by an address

    //Getter functions
    // Events -- front end will update if it is listening to an event
    event Transferred(address _from, address _to, uint256 _pokId);
    event PokemonCreated(uint256 _pokId, string _name, uint64 _level, string _pokType, uint _value);
    event TradingTurnedOn(uint256 _pokId, address _owner);

    /* Function to transfer pokemon from one address to another */
    function _transfer(address _from, address _to, uint256 _pokId)
    internal
    {
        uint i = 0;
        pokIndexToOwner[_pokId] = _to;
        ownedPoks[_to].push(_pokId);
        ownedPoksCount[_to]++;

        /* When some user already owns the pokemon */
        if(_from != address(0))
        {
            /* Deleting the pokemon from previous owner's array */
            for(i = 0;i < ownedPoks[_from].length; i++)
            {
                if(ownedPoks[_from][i] == _pokId)
                    break;
            }
            ownedPoks[_from][i] = ownedPoks[_from][ownedPoks[_from].length - 1];
            delete ownedPoks[_from][ownedPoks[_from].length - 1];
            ownedPoks[_from].length--;
            ownedPoksCount[_from]--;
        }
        else
        {
            for(uint j = 0; j < wildPokemons.length; j++)
            {
                if(wildPokemons[j] == _pokId)
                    break;
            }
            wildPokemons[j] = wildPokemons[wildPokemons.length - 1];
            delete wildPokemons[wildPokemons.length - 1];
            wildPokemons.length--;
            wildPokemonCount--;
        }
        emit Transferred (_from, _to, _pokId);
    }

    /* Function to allow trading of a pokemon */
    function allowTrading(uint64 _value, uint256 _pokId)
    public
    returns(bool){
        require(msg.sender == pokIndexToOwner[_pokId], "You are not the owner of this pokemon");
        tradePokemons[_pokId] = 1; 
        pokemons[_pokId].value = _value;
        emit TradingTurnedOn(_pokId, msg.sender);
        return true;
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
        wildPokemons.push(pokemonCount);
        wildPokemonCount++;
        pokemons.push(_pokemon);
        emit PokemonCreated(pokemonCount, _name ,_level, _pokType, _value);
        pokemonCount++;
        return pokemonCount;
    }

    /* Function to catch pokemon's
       One needs to pay some amount to catch the pokemon
       Returns true if the pokemon is caught
       Else return's false
       */
    function catchPokemon(uint256 pokID)
    public
    payable
    returns(bool)
    {
        require(pokIndexToOwner[pokID] == address(0), "This pokemon is already caught by someone");
        require(pokemons[pokID].value <= msg.value, "Not supplied the required amount");
        _transfer(0, msg.sender, pokID);
        pendingReturns[msg.sender] = msg.value - pokemons[pokID].value;
        return true;
    }
}
