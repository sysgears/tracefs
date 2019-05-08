## Tracefs

[![npm version](https://badge.fury.io/js/tracefs.svg)](https://badge.fury.io/js/tracefs)
[![Twitter Follow](https://img.shields.io/twitter/follow/sysgears.svg?style=social)](https://twitter.com/sysgears)

Traces Node fs calls to files with given path substring and logs requests and results into `<tmpdir>/tracefs.log`

## Usage

```bash
npm install tracefs
```

```bash
TRACEFS=/foo node -r tracefs myprog
```

And then check the output in
`<tmpdir>/tracefs.log`

You can also prepend substring with `console:` if you want to log calls to console instead of temporary file:
```bash
TRACEFS=console:/foo node -r tracefs myprog
```

## License
Copyright © 2019 [SysGears (Cyprus) Limited]. This source code is licensed under the [MIT] license.

[MIT]: LICENSE
[SysGears (Cyprus) Limited]: http://sysgears.com
