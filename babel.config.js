module.exports = api => {
  const isBabelRegister = api.caller(caller => caller && caller.name === '@babel/register');
  return {
    plugins: (isBabelRegister ?
      [`@babel/plugin-transform-modules-commonjs`] : []
    ).concat([`@babel/plugin-proposal-class-properties`]),
    presets: [
      `@babel/preset-typescript`
    ]
  }
};
