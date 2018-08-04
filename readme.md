Rerun failed tests


default sessionsCount is 5, for open 5 processes in parralel mode <br>
default configPath is ./protractor.conf.js<br>
default specsDir is ./spec <br>
default debug is false <br>
default count is 3, failed tests will have 3 attempts <br>

```sh
$ ./node_modules/.bin/protractor-rerun --sessionsCount 8 --count 3 --configPath ./path/to/your/protractor.conf.js --specsDir ./path/to/specDir --debug
```