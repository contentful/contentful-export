module.exports = {
    "parser": "babel-eslint",
    "extends": [
        "standard",
        "plugin:jest/recommended"
    ],
    "plugins": [
        "standard",
        "promise"
    ],
    "rules": {
        "jest/prefer-to-be-null": "warn",
        "jest/prefer-to-be-undefined": "warn"
    }
};
