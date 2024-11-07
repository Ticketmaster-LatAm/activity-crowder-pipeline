# activity-crowder-api
## Requirements
* [AWS Serverless Application Model](https://aws.amazon.com/serverless/sam/)
* [AWS CLI](https://aws.amazon.com/pt/cli/)
## build
```bash
$ sam build
```
## System Manager Store Parameters
### Database
```bash
aws ssm put-parameter --profile profile_name --name "/xx-env-activity-crowder/rds/host" --value "<<RDS Host>>" --type String --overwrite > /dev/null 2>&1
aws ssm put-parameter --profile profile_name --name "/xx-env-activity-crowder/rds/user" --value "<<RDS Username>>" --type SecureString --overwrite > /dev/null 2>&1
aws ssm put-parameter --profile profile_name --name "/xx-env-activity-crowder/rds/password" --value "<<RDS Password>>" --type SecureString --overwrite > /dev/null 2>&1
aws ssm put-parameter --profile profile_name --name "/xx-env-activity-crowder/rds/database" --value "<<RDS DB Name>>" --type String --overwrite > /dev/null 2>&1
aws ssm put-parameter --profile profile_name --name "/xx-env-activity-crowder/rds/port" --value 1433 --type String --overwrite > /dev/null 2>&1
aws ssm put-parameter --profile profile_name --name "/xx-env-activity-crowder/rds/table" --value "<<RDS DB Table Name>>" --type String --overwrite > /dev/null 2>&1
aws ssm put-parameter --profile profile_name --name "/xx-env-activity-crowder/api/movementId" --value 1 --type String --overwrite > /dev/null 2>&1
```
### Crowder API
```bash
aws ssm put-parameter --profile profile_name --name "/xx-env-activity-crowder/api/apikey" --value "<<Crowder API Key>>" --type SecureString --overwrite > /dev/null 2>&1
aws ssm put-parameter --profile profile_name --name "/xx-env-activity-crowder/api/host" --value "<<Crowder Host>>" --type String --overwrite > /dev/null 2>&1
aws ssm put-parameter --profile profile_name --name "/xx-env-activity-crowder/api/lastUpdate" --value 0 --type String --overwrite > /dev/null 2>&1
aws ssm put-parameter --profile profile_name --name "/xx-env-activity-crowder/api/movementId" --value 1 --type String --overwrite > /dev/null 2>&1
```
## deploy staging
```bash
$ sam deploy --config-file ./config/config_xx.toml
```
## deploy production
```bash
$ sam deploy --config-file ./config/config_xx.toml --config-env prod
``` 
