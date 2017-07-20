'use strict';
const Generator = require('yeoman-generator');
const Chalk = require('chalk');
const fse = require('fs-extra');

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
                break;
            case 'template':
                output_config['base_folder'] = 'templates';
                output_config['success_message'] = 'Template created';
                break;
            default:
                output_config['base_folder'] = 'modules';
                output_config['success_message'] = 'Module created';
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
    this.output_config = this.getOutputConfig(this.props.section_type);

    fse.copy(
        this.templatePath(this.output_config.section),
        this.destinationPath(Basepath + '/' + this.output_config.base_folder + '/' + this.props.module_name)
    ).then(() => {
        this.log(Chalk.green(output_config.success_message));
    })
        .catch(error => {
            this.log(Chalk.red('An error has occured: ' + error));
        });
  }
};
