import fs from 'fs';
import util from 'util'
import arg from 'arg';

const exec = util.promisify(require('child_process').exec);

function parseArgumentsIntoOptions(rawArgs) {
  const args = arg(
    {
      '--env': String,
      '--app': String,
      '--output-file': String,
      '--region': String
    },
    {
      argv: rawArgs.slice(2),
    }
  );
  if(!args['--env']) throw new Error('--env is mandatory');
  if(!args['--app']) throw new Error('--app is mandatory');
  if(!args['--output-file']) throw new Error('--output-file is mandatory');
  return{
    environmentName: args['--env'],
    applicationName: args['--app'],
    outputFile: args['--output-file'],
    region: args['--region'] || 'eu-west-2'
  }
 }

function convertToEnv(envObj, outputFileName){
  console.log(outputFileName)
  envObj.forEach(entry => {
    fs.appendFile(outputFileName, `${entry.OptionName}=${entry.Value}\n`, err => {
    if (err) console.log(err);
    });
  });
}

async function retrieveEnvData(env, app, region, returnJson = true){
  const {stdout: data} = await exec(`aws elasticbeanstalk describe-configuration-settings --environment-name ${env} --application-name ${app} --region ${region}`);
  if(returnJson){
    return JSON.parse(data);
  }
  return data;
}

export function cli (){

  const cliOptions = parseArgumentsIntoOptions(process.argv);
  retrieveEnvData(cliOptions.environmentName, cliOptions.applicationName, cliOptions.region, true).then((data) => {
    const options = data.ConfigurationSettings[0].OptionSettings;
    const envVars = options.filter(option => {
      return option.Namespace === 'aws:elasticbeanstalk:application:environment';
    })
    convertToEnv(envVars, cliOptions.outputFile);
  })
}
