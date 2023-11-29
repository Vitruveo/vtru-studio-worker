/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
    roots: ['./src'],
    transform: {
        '^.+\\.tsx?$': 'ts-jest',
    },
    setupFiles: ['dotenv/config'],
    moduleFileExtensions: ['js', 'jsx', 'json', 'ts', 'tsx', 'node'],
    moduleDirectories: ['node_modules', 'bower_components', './src'],
};
