# Politics and War - War Formulas and Mechanics Reference

*Analysis Date: August 18, 2025*  
*Source: Locutus Bot Codebase (`I:\Locus\locutus`) + Politics and War Wiki*

This document contains all the war-related formulas and mechanics extracted from the Locutus bot's source code, which provides the most accurate representation of Politics and War's game mechanics.

## Table of Contents
- [Core War System](#core-war-system)
- [Ground Battle Formulas](#ground-battle-formulas)
- [Air Battle Formulas](#air-battle-formulas)
- [Naval Battle Formulas](#naval-battle-formulas)
- [Spy Operation Formulas](#spy-operation-formulas)
- [Infrastructure and City Formulas](#infrastructure-and-city-formulas)
- [War Types and Modifiers](#war-types-and-modifiers)
- [Space Control Effects](#space-control-effects)
- [Score Calculation](#score-calculation)
- [Resource Consumption](#resource-consumption)

## Core War System

### War Ranges
```java
// From PW.java constants
public static double WAR_RANGE_MAX_MODIFIER = 2.50;  // +150%
public static double WAR_RANGE_MIN_MODIFIER = 0.75;  // -25%
public static double SPY_RANGE_MIN_MODIFIER = 0.4;   // -60%
public static double SPY_RANGE_MAX_MODIFIER = 2.5;   // +150%
```

- **War Range (Offensive)**: 0.75x to 2.5x attacker's score (-25% to +150%)
- **Spy Range**: 0.4x to 2.5x attacker's score (-60% to +150%)

### Military Action Points (MAPs)
- **Default Starting MAPs**: 6 per side
- **Blitzkrieg Policy**: Attackers start with 7 MAPs
- **Fortress Policy**: Both sides start with 5 MAPs
- **MAP Regeneration**: +1 MAP every 2 hours (12 turns per day)
- **Maximum MAPs**: 12

### Resistance System
- **Starting Resistance**: 100 per side
- **Victory Condition**: Reduce opponent's resistance to 0
- **War Duration**: Maximum 60 turns (5 days)

## Ground Battle Formulas

### Army Value Calculation
```
Army Value = (Unarmed Soldiers × 1) + (Armed Soldiers × 1.75) + (Tanks × 40)
```

### Victory Types and Rolls
- **3 Rolls**: Each between 40% and 100% of army value
- **Victory Types**:
  - Immense Triumph: 3/3 rolls won → 18-20 resistance damage
  - Moderate Success: 2/3 rolls won → 14-16 resistance damage
  - Pyrrhic Victory: 1/3 rolls won → 10-12 resistance damage
  - Utter Failure: 0/3 rolls won → 0 resistance damage

### Ground Battle Damage Calculations
```java
// From WarNation.java - Ground Battle Method
public boolean groundAttack(WarNation enemy, int soldiers, int soldiersUnarmed, int tanks, boolean enemyUsesMunitions, boolean suicide, int victory) {
    // Army strength calculation
    double attTankStr = (tanks * 40);
    double attSoldStr = soldiers * 1.75 + soldiersUnarmed;
    double attStr = attSoldStr + attTankStr;
    double defTankStr = enemy.getMaxTankStrength(this) * 40;
    double defSoldStr = Math.max(50, enemy.getSoldiers() * (enemyUsesMunitions ? 1.75 : 1));
    double defStr = defSoldStr + defTankStr;

    // Roll calculation
    double roll = roll(defStr, attStr);
    double attFactor = (1680 * (3 - roll) + 1800 * roll) / 3;
    double defFactor = 1680 + (1800 - attFactor);

    // Tank losses
    double defTankLoss = ((attTankStr * 0.7 + 1)/ defFactor + (attSoldStr * 0.7 + 1) / 2250) * 1.33;
    double attTankLoss = ((defTankStr * 0.7 + 1)/ attFactor + (defSoldStr * 0.7 + 1) / 2250) * enemy.getFortifyFactor() * 1.33;

    // Soldier losses  
    double attSoldLoss = ((defSoldStr * 0.7 + 1)/22 + (defTankStr * 0.7 + 1)/7.33) * enemy.getFortifyFactor() * 0.3125;
    double defSoldLoss = (attSoldStr * 0.7 + 1)/22 + (attTankStr * 0.7 + 1)/7.33 * 0.3125;
}
```

### Loot and Infrastructure Damage
```java
// Loot calculation
double loot = Math.max(0, Math.min(Math.min(((soldiers * 0.99) + (tanks * 22.625) * victory), money * 0.75), money - 50000 * enemy.getCities())) * getLootFactor();

// Infrastructure damage
double infra = Math.max(Math.min(((soldiers - (enemy.getSoldiers() * 0.5)) * 0.000606061 + (tanks - (enemy.getTanks() * 0.5)) * 0.01) * 0.95 * (victory / 3d), enemy.getAvg_infra() * 0.2 + 25), 0);
```

## Air Battle Formulas

### Aircraft Combat Effectiveness
```java
// Aircraft vs Soldiers
int soldiersKilled = (int) (0.58139534883720930232558139534884 * (roll * Math.round(Math.max(Math.min(enemy.getSoldiers(), Math.min(enemy.getSoldiers() * 0.75 + 1000, (aircraft - defStr * 0.5) * 50 * 0.95)), 0)) / 3));

// Aircraft vs Tanks  
int tanksKilled = (int) (0.32558139534883720930232558139535 * (roll * Math.round(Math.max(Math.min(enemy.getTanks(), Math.min(enemy.getTanks() * 0.75 + 10, (aircraft - defStr * 0.5) * 2.5 * 0.95)), 0)) / 3));

// Aircraft vs Ships
int shipsKilled = (int) (0.82926829268292682926829268292683 * (roll * Math.round(Math.max(Math.min(enemy.getShips(), Math.min(enemy.getShips() * 0.5 + 4, (aircraft - defStr * 0.5) * 0.0285 * 0.95)), 0)) / 3));
```

### Air Infrastructure Damage
```java
double infra = Math.max(Math.min((aircraft - (defStr * 0.5)) * 0.35353535 * 0.95 * (roll / 3), enemy.getAvg_infra() * 0.5 + 100), 0);
```

### Aircraft Losses
```java
// Air vs Air Combat
double attAirLoss = 0.63855421686746987951807228915663 * enemy.getFortifyFactor() * 9 * (defStr * 0.7)/54;
double defAirLoss = 0.63855421686746987951807228915663 * 9 * (aircraft * 0.7)/38;

// Other Air Attacks
double attAirLoss = 0.5 * enemy.getFortifyFactor() * 9 * (defStr * 0.7)/54;
double defAirLoss = 0.5 * 9 * (aircraft * 0.7)/54;
```

## Naval Battle Formulas

### Naval Infrastructure Damage
```java
double infra = Math.max(Math.min(ships - (defShips * 0.5) * 2.625 * 0.95 * (roll / 3), enemy.getAvg_infra() * 0.5 + 25), 0);
```

### Naval Losses
```java
double attNavyLoss = 0.44166666666666666666666666666667 * enemy.getFortifyFactor() * 12 * (defShips * 0.7)/35;
double defNavyLoss = 0.44166666666666666666666666666667 * 12 * (ships * 0.7)/35;
```

## Spy Operation Formulas

### Spy Success Odds Calculation
```java
public static double getOdds(int attacking, int defending, int safety, Operation operation, boolean arcane, boolean tactician, boolean defenderHasSN) {
    double chi = 1;
    if (arcane) chi -= 0.15;        // Arcane War Policy: -15% spy success
    if (tactician) chi += 0.15;     // Tactician War Policy: +15% spy success
    if (defenderHasSN) chi -= 0.1;  // Surveillance Network: -10% enemy spy success
    
    double success = ((50d * operation.odds) - (safety * 25d)) * chi;
    // Additional calculations for final odds...
}
```

### Spy Operations and Safety Levels
- **Safety 1**: Highest success rate, most spy losses
- **Safety 2**: Medium success rate, medium spy losses  
- **Safety 3**: Lowest success rate, fewest spy losses

### Spy Kills Calculation
```java
// When defender has Surveillance Network
if (defenderHasSN) killed *= 0.75;  // 25% reduction in spy kills
```

## Infrastructure and City Formulas

### Infrastructure Cost Formula
```java
// From PW.java City.Infra class
public static double calculateInfra(double from, double to) {
    // For infrastructure cost calculation
    double x = (infra_cents * 0.01) - 10d;
    int cost = Math.toIntExact(Math.round(100 * (300d + (Math.pow(x, (2.2d))) * 0.00140845070422535211267605633803)));
    
    // Selling infrastructure
    if (to <= from) return (from - to) * -150;  // 150 per infra when selling
}
```

### Land Cost Formula
```java
// From PW.java City.Land class
public static double calculateLand(double from, double to) {
    double total = 0;
    for (double i = Math.max(0, from); i < to; i += 500) {
        double cost = 0.002d * Math.pow(Math.max(20, i - 20), 2) + 50;
        double amt = Math.min(500, to - i);
        total += cost * amt;
    }
    return total;
}
```

### Infrastructure Cost Reduction Projects
```java
public static double getCostReduction(boolean up, boolean aup, boolean mp) {
    double reduction = 0;
    if (up) reduction += 173118000;   // Urban Planning
    if (aup) reduction += 346236000;  // Advanced Urban Planning  
    if (mp) reduction += 519354000;   // Metropolitan Planning
    return reduction;
}
```

## War Types and Modifiers

### War Type Effects
| War Type | Infrastructure Damage | Loot |
|----------|----------------------|------|
| **Ordinary** | 50% | 50% |
| **Attrition** | 100% | 25% |
| **Raid** | 25% | 100% |

### Military Upkeep Modifiers
- **Peacetime**: Standard upkeep rates
- **Wartime**: 1.5x upkeep for all units

### Unit Costs and Upkeep
| Unit | Build Cost | Peacetime Upkeep | Wartime Upkeep |
|------|------------|------------------|----------------|
| Soldier | $5 | $1.25 + 0.0013 food | $1.88 + 0.002 food |
| Tank | $60 + 0.5 steel | $50 | $75 |
| Aircraft | $4,000 + 5 aluminum | $500 | $750 |
| Ship | $50,000 + 30 steel | $3,750 | $5,625 |
| Spy | $50,000 | $2,400 | $2,400 |
| Missile | $150,000 + resources | $21,000 | $31,500 |
| Nuke | $1,750,000 + resources | $35,000 | $52,500 |

## Space Control Effects

### Ground Control
- **Achieved**: Immense Triumph in Ground Battle
- **Effect**: Tanks destroy aircraft when any non-failure ground attack occurs
- **Aircraft Loss Factors**:
  ```java
  switch (victory) {
      case 3: factor = 0.005025; break;    // Immense Triumph
      case 2: factor = 0.00335; break;     // Moderate Success
      case 1: factor = 0.001675; break;    // Pyrrhic Victory
  }
  double defAirLosses = tanks * factor;
  ```

### Air Superiority  
- **Achieved**: Immense Triumph in Airstrike
- **Effect**: Enemy tanks have 66% effectiveness (0.66 multiplier)

### Blockade
- **Achieved**: Immense Triumph in Naval Battle  
- **Effect**: Prevents resource/money transfers

### Fortification
- **Effect**: +25% casualties to attackers (`enemy.getFortifyFactor()` returns 1.25)
- **Removed**: When performing any offensive action

## Score Calculation

### Score Formula
```java
double score = 10 +                              // Base score
    researchScore +                              // Research points
    (projects * Projects.getScore()) +           // Projects × project score value
    ((cities - 1) * 100) +                      // (Cities - 1) × 100
    (totalInfra / 40d) +                        // Total infrastructure ÷ 40
    militaryScore;                              // Sum of all military unit scores
```

### Military Unit Score Contributions
Each unit type contributes to nation score based on quantity and unit-specific multipliers defined in the `MilitaryUnit` enum.

## Resource Consumption in War

### Ground Battles
```java
// Resource consumption per battle
double attMuni = (0.0002 * soldiers) + 0.01 * tanks;  // Munitions for soldiers + tanks
double attGas = 0.01 * tanks;                          // Gasoline for tanks only
```

### Air Battles  
```java
// Aircraft resource consumption per battle
consume(ResourceType.GASOLINE, 0.25 * aircraft, 3, 0);     // 0.25 gas per aircraft
consume(ResourceType.MUNITIONS, 0.25 * aircraft, 3, 0);    // 0.25 munitions per aircraft
```

### Naval Battles
```java
// Ship resource consumption per battle
int attGas = 2 * ships;   // 2 gasoline per ship
int attMuni = 3 * ships;  // 3 munitions per ship
```

## Battle Odds Calculation

### Core Odds Formula
```java
public static double getOdds(double attStrength, double defStrength, int success) {
    attStrength = Math.pow(attStrength, 0.75);  // Apply 0.75 power
    defStrength = Math.pow(defStrength, 0.75);  // Apply 0.75 power

    double attMin = attStrength * 0.4;          // Minimum roll: 40%
    double attMax = attStrength;                // Maximum roll: 100%
    double defMin = defStrength * 0.4;
    double defMax = defStrength;

    // Calculate probability using geometric probability
    double sampleSpace = (attMax - attMin) * (defMax - defMin);
    double overlap = Math.min(attMax, defMax) - Math.max(attMin, defMin);
    double p = (overlap * overlap * 0.5) / sampleSpace;
    if (attStrength > defStrength) p = 1 - p;

    // Apply binomial distribution for 3 rolls
    int k = success;  // Number of successes needed
    int n = 3;        // Total number of rolls
    double odds = Math.pow(p, k) * Math.pow(1 - p, n - k);
    double npr = MathMan.factorial(n) / (double) (MathMan.factorial(k) * MathMan.factorial(n - k));
    return odds * npr;
}
```

## Roll Calculation System

### Battle Roll Formula
```java
public static double roll(double defending, double attacking) {
    double minDef = defending * 0.4d;   // Defender minimum (40%)
    double minAtt = attacking * 0.4d;   // Attacker minimum (40%)
    
    if (attacking <= minDef || attacking == 0) return 0;      // Guaranteed failure
    if (defending < minAtt) return 3;                         // Guaranteed success
    
    double defMean = (defending + minDef) * 0.5;
    double greater = attacking - defMean;
    double lessThan = defMean - minAtt;
    
    if (greater <= 0) return 0;
    if (lessThan <= 0) return 3;
    
    return 3 * greater / (greater + lessThan);  // Returns 0-3 representing victory level
}
```

---

## Notes for War Simulation Development

This document provides the foundation for creating a fully simulated war environment. Key considerations:

1. **Battle Resolution**: All battles use the 3-roll system with 40%-100% strength ranges
2. **Resistance Tracking**: Each action reduces resistance by specific amounts based on victory type
3. **Resource Management**: Track munitions, gasoline consumption for sustained warfare
4. **Space Control**: Implement ground control, air superiority, and blockade effects
5. **Timing**: MAP regeneration every 2 hours affects battle pacing
6. **Project Effects**: Many projects modify battle effectiveness and costs

**Source Code References:**
- Main formulas: `I:\Locus\locutus\src\main\java\link\locutus\discord\util\PW.java`
- Battle simulation: `I:\Locus\locutus\src\main\java\link\locutus\discord\util\battle\sim\WarNation.java`
- Spy calculations: `I:\Locus\locutus\src\main\java\link\locutus\discord\util\SpyCount.java`

*This analysis was compiled from the Locutus bot source code, which is considered the most accurate representation of Politics and War's game mechanics available.*
