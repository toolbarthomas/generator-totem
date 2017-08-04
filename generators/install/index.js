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
            },
            {
                type: 'list',
                name: 'branch',
                message: 'Select the desired branch to download',
                choices: [
                    {
                        value: 'master',
                        name: 'Master (stable)'
                    },
                    {
                        value: 'develop',
                        name: 'Develop (latest)'
                    }
                ],
                default: 0,
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

        remote('toolbarthomas', 'totem', props.branch, function (err, cache_path) {

            fse.copy(
                cache_path,
                props.path,
                error => {
                if (error) {
                    return error;
                }

                this.log(chalk.green('Done, installing dependencies.'));

                if(props.path != '')
                {
                    process.chdir(props.path);
                }

                this.installDependencies({
                    npm: true,
                    bower: true,
                    yarn: false
                });

                done();
            });

        }.bind(this));
    }
};
