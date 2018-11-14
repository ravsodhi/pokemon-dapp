pragma solidity ^0.4.24;

contract Pokemon
{
    uint public pokemonCount = 0;
    uint public wildPokemonCount = 0;
    uint public tradePokemonCount = 0;

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
        uint64 train_value; // value required to train pokemon.
    }

    Pokemon[] public pokemons; // A list of ALL the pokemons in existence
    uint256[] public wildPokemons;
    mapping(uint256 => uint) public tradePokemons; // 1 if a pokemon is tradeble, otherwise 0
    mapping(uint256 => uint) public trainPokemon;
    mapping(uint256 => uint256) public tradeTime;
    mapping(uint256 => address) public pokIndexToOwner; // The mapping defining the owner of specific pokemon
    mapping(address => uint) public pendingReturns; // Storing the pending returns of some user
    mapping(address => uint256[]) public ownedPoks;  // All the pokemons owned by an address(includes the ones which are trade market also)
    mapping(address => uint256) public ownedPoksCount; // The number of pokemons owned by an address(includes the tradable ones also)
    mapping(address => uint256) public tradePoksCount; // Number of pokemons put up for trade by and address
   
    mapping(uint256 => uint256) public pokemonTransactionHash; // Store the transaction with which the pokemon is related to

    //Getter functions
    // Events -- front end will update if it is listening to an event
    event Transferred(address _from, address _to, uint256 _pokId, uint256 txnHash);
    event PokemonCreated(uint256 _pokId, string _name, uint64 _level, string _pokType, uint _value, uint256 txnHash);
    event TradingTurnedOn(uint256 _pokId, address _owner, uint256 txnHash);
    event TradingTurnedOff(uint256 _pokId, address _owner, uint256 txnHash);
    /* Function to transfer pokemon from one address to another */
    function _transfer(address _from, address _to, uint256 _pokId)
    internal
    {
        require(_from == pokIndexToOwner[_pokId], "You are not the owner of the pokemon");
        require(_to != pokIndexToOwner[_pokId], "You can not transfer the pokemon to yourselves");
        uint i = 0;
        pokIndexToOwner[_pokId] = _to;
        ownedPoks[_to].push(_pokId);
        ownedPoksCount[_to]++;
        tradePokemons[_pokId] = 0;      // Trading is turned off when the pokemon is bought by someone else

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
            tradePoksCount[_from]--;        // This traded pokemon is now sold
            tradePokemonCount--;            // Total number of tradable pokemon in the market reduces by one
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
        pokemonTransactionHash[_pokId]++;
        emit Transferred (_from, _to, _pokId, pokemonTransactionHash[_pokId]);
    }

    /* Function to buy a pokemon from the trade market */
    function buyFromTradeMarket(uint256 _pokId)
    public
    payable
    {
        require(msg.value >= pokemons[_pokId].value, "Did not supply the proper amount");
        pendingReturns[pokIndexToOwner[_pokId]] += pokemons[_pokId].value;
        pendingReturns[msg.sender] += msg.value - pokemons[_pokId].value;
        _transfer(pokIndexToOwner[_pokId], msg.sender, _pokId); // Transfer the ownership of pokemon to the buyer
    }

    /* Function to disable trade on a pokemon that is put up for sale on trade market */
    function disableTrade(uint256 _pokId)
    public
    returns(bool)
    {
        require(msg.sender == pokIndexToOwner[_pokId], "You are not the owner of this pokemon");
        tradePokemons[_pokId] = 0;
        tradePokemonCount--;
        tradePoksCount[msg.sender]--;
        pokemonTransactionHash[_pokId]++;
        emit TradingTurnedOff(_pokId, msg.sender, pokemonTransactionHash[_pokId]);
        return true;
    }

    /* Function to allow trading of a pokemon */
    function allowTrading(uint64 _value, uint256 _pokId)
    public
    returns(bool){
        require(now >= tradeTime[_pokId], "Trade disallowed at this timestamp.");
        require(msg.sender == pokIndexToOwner[_pokId], "You are not the owner of this pokemon");
        tradePokemons[_pokId] = 1;
        tradePokemonCount++;
        tradePoksCount[msg.sender]++;
        pokemons[_pokId].value = _value;
        pokemonTransactionHash[_pokId]++;
        emit TradingTurnedOn(_pokId, msg.sender, pokemonTransactionHash[_pokId]);
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
            value : _value,
            train_value : 0
        });
        wildPokemons.push(pokemonCount);
        wildPokemonCount++;
        pokemons.push(_pokemon);
        pokemonTransactionHash[_pokemon.pokId]++;
        emit PokemonCreated(pokemonCount, _name ,_level, _pokType, _value, pokemonTransactionHash[_pokemon.pokId]);
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
        pendingReturns[msg.sender] += msg.value - pokemons[pokID].value;
        tradeTime[pokID] = now;
        return true;
    }

    function trainPokemon(uint256 pokId)
    public
    payable
    returns(bool)
    {
        // console.log(now);
        require(tradeTime[pokId] <= now, "The pokemon is not eligible for training.");
        require(tradePokemons[pokId] == 0, "The pokemon is not eligible for training.");
        require(pokIndexToOwner[pokId] == msg.sender, "You should own the pokemon to train it.");
        require(pokemons[pokId].train_value <= msg.value, "Insufficient funds for training.");
        pendingReturns[msg.sender] += msg.value - pokemons[pokId].train_value;
        pokemons[pokId].level +=1;
        tradeTime[pokId] = now + 25;
    }
    function withdraw()
    public
    returns(bool)
    {
        uint amount = pendingReturns[msg.sender];
        if(amount > 0){
            pendingReturns[msg.sender] = 0;
            msg.sender.transfer(amount);
        }
        return true;
    }
}
