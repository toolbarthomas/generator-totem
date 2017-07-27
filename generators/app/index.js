'use strict';
const Generator = require('yeoman-generator');
const Chalk = require('chalk');
const fse = require('fs-extra');
const path = require('path');
const replace = require('replace-in-file');

const Basepath = './src/resources';

class Totem extends Generator {
    getOutputConfig(section_type) {
        var output_config = [];

        output_config['section'] = section_type;

        // Define the base folder to place the new module in.
        switch(section_type) {
            case 'page':
                output_config['base_folder'] = 'pages';
                output_config['success_message'] = 'Page created';
                output_config['base_files'] = [
                    'stylesheets/page.scss',
                    'javascripts/page.js'
                ];
                output_config['callback'] = function(src, name) {
                    var files = [
                        src + '/index.twig'
                    ];

                    replace({
                        from: [/__PAGE__/g],
                        to: name,
                        files: files,
                        encoding: 'utf8'
                    });
                }
                break;
            case 'template':
                output_config['base_folder'] = 'templates';
                output_config['success_message'] = 'Template created';
                output_config['base_files'] = [
                    'stylesheets/template.scss',
                    'javascripts/template.js',
                    'template.twig'
                ];
                break;
            default:
                output_config['base_folder'] = 'modules';
                output_config['success_message'] = 'Module created';
                output_config['base_files'] = [
                    'stylesheets/module.scss',
                    'javascripts/module.js'
                ];
                output_config['callback'] = function (src, name) {
                    var files = [
                        src + '/stylesheets/' + name +'.scss'
                    ];

                    replace({
                        from: [/__MODULE__/g],
                        to: name,
                        files: files,
                        encoding: 'utf8'
                    });
                }
        }

        return output_config;
    }
}
module.exports = class extends Totem  {
  prompting() {
    this.log('');
    this.log(Chalk.green('Welcome to Totem module generator.') + '\n');
    this.log(Chalk.green('This setup will let you create a new module within a specifc section') + '\n');
    this.log(Chalk.reset('For more information: https://github.com/toolbarthomas/generator-totem') + '\n');

    const prompts = [
    {
            type: 'list',
            name: 'section_type',
            message: 'For which type do you wan\'t to define your new module in?',
            choices: [
                'module',
                'page',
                'template'
            ],
            default: 0
        },
        {
            type: 'input',
            name: 'module_name',
            message: 'Name your module',
            default: 'new-module'
        }
    ];

    return this.prompt(prompts).then(props => {
        // To access props later use this.props.someAnswer;
        this.props = props;

        this.log(Chalk.green('Affirmative, ready to setup ' + this.props.module_name))
    });
  }

  writing() {
    var module_name = this.props.module_name;
    var output_config = this.getOutputConfig(this.props.section_type);

    var dest = Basepath + '/' + output_config.base_folder + '/' + module_name;

    // Create file structure for the selected type
    fse.copy(
        this.templatePath(output_config.section),
        this.destinationPath(dest)
    ).then(() => {
        this.log(Chalk.yellow('Structure created, creating files...'));

        if(typeof output_config.base_files === 'undefined') {
            return;
        }

        var i = 0;
        output_config.base_files.forEach(function(base_file) {
            var rename = {
                input: dest + '/' + base_file,
                output: path.dirname(dest + '/' + base_file) + '/' + this.props.module_name + '.' + (path.extname(base_file).split('.').pop())
            };

            // Rename the base files
            fse.rename(rename.input, rename.output, function(error) {
                i++;

                if(error) {
                    throw error;
                }

                // Init the callback when all files have been renamed
                if (i < (output_config.base_files.length)) {
                    return;
                }

                if (typeof output_config.callback != 'function')
                {
                    return;
                }

                output_config.callback(dest, module_name);
            });
        }, this);

        this.log(Chalk.green(output_config.success_message));
    }).catch(error => {
        this.log(Chalk.red('An error has occured: ' + error));
     });
  }
};
