## Tracefs

[![npm version](https://badge.fury.io/js/tracefs.svg)](https://badge.fury.io/js/tracefs)
[![Twitter Follow](https://img.shields.io/twitter/follow/sysgears.svg?style=social)](https://twitter.com/sysgears)

Traces Node fs calls to files with given path substring and logs requests and results into `<tmpdir>/tracefs.log`

## Usage

```bash
npm install tracefs
```

```bash
tracefs -e :pathSubstring node ./myscript
```

or

```bash
tracefs -e trace.log:pathSubstring node ./myscript
```

Output example:
![Alt text](/screenshot.png?raw=true "Output Example")

## License
Copyright © 2019 [SysGears (Cyprus) Limited]. This source code is licensed under the [MIT] license.

[MIT]: LICENSE
[SysGears (Cyprus) Limited]: http://sysgears.com
