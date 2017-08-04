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
                    name = name.split('.').join('');

                    return name;
                }
            }
        ];

        return this.prompt(prompts).then(props => {
            this.props = props;

            this.log(chalk.green('All done, Fetching Totem...'))
        });

        return;
    }

    writing() {
        var done = this.async();
        var props = this.props;
        var path = props.path + '/**';

        remote('toolbarthomas', 'totem', 'master', function (err, cache_path) {
            del([cache_path]).then(function() {

            });

            this.fs.copy(
                cache_path,
                this.destinationPath(props.path)
            );
            done();
        }.bind(this));
    }
};
