'use strict';

// Load up the ENV file
require('dotenv').config();

// Set default destination for our generator commands
if (typeof process.env.TOTEM_GENERATOR_DEST === 'undefined') {
    process.env.TOTEM_GENERATOR_DEST = './src/resources';
}

// Cleanup the last slash tha't has been defined in our env variable.
if (process.env.TOTEM_GENERATOR_DEST.substring(process.env.TOTEM_GENERATOR_DEST.length - 1) == "/") {
    process.env.TOTEM_GENERATOR_DEST = process.env.TOTEM_GENERATOR_DEST.substring(0, process.env.TOTEM_GENERATOR_DEST.length - 1);
}

const Generator = require('yeoman-generator');
const Chalk = require('chalk');
const Fse = require('fs-extra');
const Path = require('path');
const Replace = require('replace-in-file');
const Cwd = process.cwd();
const UpdateNotifier = require('update-notifier');

if (Fse.existsSync(__dirname + '/../../package.json')) {
    var pkg = JSON.parse(Fse.readFileSync(__dirname + '/../../package.json'));

    UpdateNotifier({
        pkg,
        updateCheckInterval: 1000 * 60 * 60
    }).notify();
}

class Totem extends Generator {
    getOutputConfig(category) {
        var output_config = [];

        output_config['category'] = category;

        // Define the base folder to place the new module in.
        switch(category) {
            case 'group':
                output_config['base_folder'] = 'groups';
                output_config['success_message'] = 'Page created',
                output_config['base_files'] = [
                    'stylesheets/group.scss',
                    'javascripts/group.js'
                ];
                output_config['callback'] = function(src, labels) {
                    if(typeof labels.title === 'undefined' || labels.template === 'undefined' ) {
                        return;
                    }

                    // All files that should have replaced content that matches the new page name
                    var files = [
                        src + '/pages/index.twig',
                        src + '/stylesheets/' + labels.title + '.scss',
                        src + '/javascripts/' + labels.title + '.js'
                    ];

                    Replace({
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

                    // All files that should have replaced content that matches the new template name
                    var files = [
                        src + '/' + labels.title + '.twig'
                    ];

                    Replace({
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

                    // All files that should have replaced content that matches the new module name
                    var files = [
                        src + '/package.json',
                        src + '/stylesheets/' + labels.title +'.scss',
                        src + '/index.twig'
                    ];

                    Replace({
                        files: files,
                        from: [
                            /__MODULE__/g,
                            /__TOTEM_GENERATOR_DEST__/g
                        ],
                        to: [
                            labels.title,
                            process.env.TOTEM_GENERATOR_DEST, // Match the relative path to our generator path,
                        ],
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
            message: 'Which type do you wan\'t to scaffold.',
            choices: [
                'module',
                'group',
                'template'
            ],
            default: 0,
        },
        {
            type: 'input',
            name: 'title',
            message: 'Name your new partial.',
            default: 'new',
            filter: function(name) {
                return name = name.split(' ').join('-');
            }
        },
        {
            when: function(response) {
                return response.category == 'group';
            },
            name: 'template',
            message: 'For wich template is this page meant for?',
            default: 'default'
        },
        {
            type: 'confirm',
            name: 'destination',
            message: 'Do you want to place your partial within the Totem project structure?' + ' -> (' + process.env.TOTEM_GENERATOR_DEST + ')',
            default: 0,
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


    var dest = Cwd;
    // Set the generated files destination
    if (this.props.destination) {
        dest = process.env.TOTEM_GENERATOR_DEST + '/' + output_config.base_folder + '/' + title;
    }

    // Create file structure for the selected type
    Fse.copy(
        this.templatePath(output_config.category),
        this.destinationPath(dest)
    ).then(() => {
        this.log(Chalk.yellow('Structure created, creating files...'));

        if(typeof output_config.base_files === 'undefined') {
            output_config.callback(dest, {
                title: title,
                template: template
            });

            return;
        }

        // Queuer to fire up the callback
        var queue = 0;
        output_config.base_files.forEach(function(base_file) {
            var rename = {
                input: dest + '/' + base_file,
                output: Path.dirname(dest + '/' + base_file) + '/' + this.props.title + suffix + '.' + (Path.extname(base_file).split('.').pop())
            };

            // Rename the base files
            Fse.rename(rename.input, rename.output, function(error) {
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