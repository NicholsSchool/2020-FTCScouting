var methods = {};

/**
 * Returns an empty match data storage object
 * 
 * @return an empty match data storage object
 */
methods.getEmptyMatchData = function(){
    return {
        match: "",
        team: "",
        gamePlay: {
            auto: {
                "delivery_one_is_stone": 0,
                "delivery_one_is_skystone": 0,
                "delivery_two_is_stone": 0,
                "delivery_two_is_skystone": 0,
                "extra_delivers": 0,
                "stones_placed": 0,
                "started_in_loading": 0,
                "started_in_build": 0,
                "foundation_repositioned": 0,
                "parked": 0,
                "score": 0,
            },
            teleop: {
                "delivered": 0,
                "placed": 0,
                "score": 0,
            },
            end: {
                "capstone_placed": 0,
                "capstone_height": 0,
                "foundation_repositioned": 0,
                "parked": 0,
                "score": 0,
            },
            totalScore: 0
        }
    }
}

/**
 * Returns an object containing the point values for each task being scouted
 * 
 * @return an object containing the point values for each task being scouted
 */
methods.getDataPointValues = function() {
    return {
        auto: {
            "delivery_one_is_stone": 2,
            "delivery_one_is_skystone": 10,
            "delivery_two_is_stone": 2,
            "delivery_two_is_skystone": 10,
            "extra_delivers": 2,
            "stones_placed": 4,
            "started_in_loading": 0,
            "started_in_build": 0,
            "foundation_repositioned": 10,
            "parked": 5,
        },
        teleop: {
            "delivered": 1,
            "placed": 1,
        },
        end: {
            "capstone_placed": 5,
            "capstone_height": 1,
            "foundation_repositioned": 15,
            "parked": 5,
        },
    }
}

/**
 * Returns an object containing each task which only one team can accomplish per match
 * 
 * @return an object containing each task which only one team can accomplish per match
 */
methods.getDependentData = function() {

    return {
    }
}

module.exports = methods;