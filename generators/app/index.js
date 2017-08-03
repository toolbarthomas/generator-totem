'use strict';
const Generator = require('yeoman-generator');
const Chalk = require('chalk');
const fse = require('fs-extra');
const path = require('path');
const replace = require('replace-in-file');

const Basepath = './src/resources';

class Totem extends Generator {
    getOutputConfig(category) {
        var output_config = [];

        output_config['category'] = category;

        // Define the base folder to place the new module in.
        switch(category) {
            case 'page':
                output_config['base_folder'] = 'pages';
                output_config['success_message'] = 'Page created';
                output_config['base_files'] = [
                    'stylesheets/page.scss',
                    'javascripts/page.js'
                ];
                output_config['callback'] = function(src, labels) {
                    if(typeof labels.title === 'undefined' || labels.template === 'undefined' ) {
                        return;
                    }

                    var files = [
                        src + '/index.twig'
                    ];

                    replace({
                        files: files,
                        from: [
                            /__PAGE__/g,
                            /__TEMPLATE__/g
                        ],
                        to: [
                            labels.title,
                            labels.template
                        ],
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
                output_config['callback'] = function (src, labels) {
                    if (typeof labels.title === 'undefined') {
                        return;
                    }

                    var files = [
                        src + '/' + labels.title + '.twig'
                    ];

                    replace({
                        files: files,
                        from: [/__TEMPLATE__/g],
                        to: labels.title,
                        encoding: 'utf8'
                    });
                }
                break;
            default:
                output_config['base_folder'] = 'modules';
                output_config['success_message'] = 'Module created';
                output_config['base_files'] = [
                    'stylesheets/module.scss',
                    'javascripts/module.js'
                ];
                output_config['callback'] = function (src, labels) {
                    if(typeof labels.title === 'undefined') {
                        return;
                    }

                    var files = [
                        src + '/stylesheets/' + labels.title +'.scss'
                    ];

                    replace({
                        files: files,
                        from: [/__MODULE__/g],
                        to: labels.title,
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
    this.log(Chalk.green('This setup will let you create a new module within the specified category') + '\n');
    this.log(Chalk.reset('See: https://github.com/toolbarthomas/generator-totem') + '\n');

    const prompts = [
    {
            type: 'list',
            name: 'category',
            message: 'For which category do you wan\'t to define your partial in?',
            choices: [
                'module',
                'page',
                'template'
            ],
            default: 0,
        },
        {
            type: 'input',
            name: 'title',
            message: 'Name your partial.',
            default: 'new',
            filter: function(name) {
                return name = name.replace(' ','-');
            }
        },
        {
            when: function(response) {
                return response.category == 'page';
            },
            name: 'template',
            message: 'For wich template is this page meant for?',
            default: 'default'
        }
    ];

    return this.prompt(prompts).then(props => {
        // To access props later use this.props.someAnswer;
        this.props = props;

        this.log(Chalk.green('Affirmative, ready to setup ' + this.props.title))
    });
  }

  writing() {
    var category = this.props.category;
    var title = this.props.title;
    var template = this.props.template;

    var output_config = this.getOutputConfig(this.props.category);

    var dest = Basepath + '/' + output_config.base_folder + '/' + title;

    // Create file structure for the selected type
    fse.copy(
        this.templatePath(output_config.category),
        this.destinationPath(dest)
    ).then(() => {
        this.log(Chalk.yellow('Structure created, creating files...'));

        if(typeof output_config.base_files === 'undefined') {
            return;
        }

        // Queuer to fire up the callback
        var queue = 0;
        output_config.base_files.forEach(function(base_file) {
            var rename = {
                input: dest + '/' + base_file,
                output: path.dirname(dest + '/' + base_file) + '/' + this.props.title + '.' + (path.extname(base_file).split('.').pop())
            };

            // Rename the base files
            fse.rename(rename.input, rename.output, function(error) {
                if(error) {
                    throw error;
                }

                queue++;

                // Init the callback when all files have been renamed
                if (queue < (output_config.base_files.length)) {
                    return;
                }

                // Proceed if we have a callback defined
                if (typeof output_config.callback != 'function') {
                    return;
                }

                output_config.callback(dest, {
                    title: title,
                    template: template
                });
            });
        }, this);

        this.log(Chalk.green(output_config.success_message));
    }).catch(error => {
        this.log(Chalk.red('An error has occured: ' + error));
     });
  }
};
