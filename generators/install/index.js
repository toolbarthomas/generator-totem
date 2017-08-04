'use strict';
const generator = require('yeoman-generator');
const remote = require('yeoman-remote');
const chalk = require('chalk');
const path = require('path');
const fse = require('fs-extra');
const del = require('del');

module.exports = class extends generator {
    prompting() {
        this.log('');
        this.log(chalk.green('Welcome to Totem') + '\n');
        this.log(chalk.green('This setup will install the latest version of Totem') + '\n');
        this.log(chalk.reset('See: https://github.com/toolbarthomas/totem') + '\n');

        const prompts = [
            {
                type: 'input',
                name: 'path',
                message: 'Define an additional path to install Totem',
                default: '',
                filter: function (name) {
                    name = name.split(' ').join('-');

                    return name;
                },
                validate: function(name) {
                    var done = this.async();

                    // Clone into current directory
                    if(name === '') {

                        fse.readdir(__dirname, function (err, files) {
                            if (err) {
                                done(error);
                                return;
                            } else {
                                if (!files.length)
                                {
                                    done('Root directory is not empty, aborting.', false);
                                    return;
                                }
                            }
                        });
                    }
                    else {
                        fse.pathExists(name, (error, exists) => {
                            if(error) {
                                done(error, false);
                                return;
                            }

                            if(exists) {
                                done('Directory already exists! Please use another destination.');
                                return;
                            }
                        });
                    }

                    done(null, true);
                }
            }
        ];

        return this.prompt(prompts).then(props => {
            this.props = props;

            this.log(chalk.green('Ready to download...'))
        });

        return;
    }

    writing() {
        var done = this.async();
        var props = this.props;

        remote('toolbarthomas', 'totem', 'develop', function (err, cache_path) {

            fse.copy(
                cache_path,
                props.path,
                error => {
                if (error) {
                    return error;
                }

                done();
                this.log(chalk.green('Done'))
            });

        }.bind(this));
    }
};
