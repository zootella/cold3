# net23

notes

```

== install aws cli

npm's aws-cli is deprecated as of 6 years ago
it seems most people install aws-cli with python
https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html
amazon docs say for windows install that msi

$ aws --version
aws-cli/2.16.4 Python/3.11.8 Windows/10 exe/AMD64

== give aws cli access to your aws account

$ aws configure

AWS Access Key ID [None]: YOUR_ACCESS_KEY_ID
AWS Secret Access Key [None]: YOUR_SECRET_ACCESS_KEY
Default region name [None]: us-east-1
Default output format [None]: json

dashboards at aws.amazon.com
iam dashboard
click the number of users
create user
net23dev2, example name
attach policies directly
check AdministratorAccess, second one
create user

click new user
access key 1, create access key
use case, command line interface, check understand reccomendation, next
no description, create access key

secret access key only shows once, paste it right into bash

$ aws sts get-caller-identity
$ aws s3 ls

confirm you're in, and list your buckets

== install serverless framework

https://www.serverless.com/

$ npm install -g serverless
$ serverless --version

== setup repository on github

made repo on github with node defaults
$ git clone https://github.com/zootella/net23

$ cd net23
move aside .gitignore as serverless create will also make one
$ serverless create --template aws-nodejs --path .

$ npm init
$ npm install -S aws-sdk

amazon access is configured, but make .env to mirror non-amazon secrets the lambdas will use
$ touch .env
and make sure .gitignore lists it

== domain name

registered net23.cc at a third party registrar

aws web console, route53 dashboard, hosted zones, create hosted zone
net23.cc, domain name
public already selected, create hosted zone
leads to page for new hosted zone, titled net23.cc, with two records
the NS record shows the name servers amazon has picked for us:

ns-1619.awsdns-10.co.uk.
ns-1281.awsdns-32.org.
ns-682.awsdns-21.net.
ns-211.awsdns-26.com.

go back to the registrar to put those in
nameservers, basic dns, changing that to custom dns
entering the four name servers above, *without* the periods at the ends

dnspropegation happens pretty quick, then check with nslookup

$ nslookup net23.cc
$ nslookup net23.cc 8.8.8.8
$ nslookup -type=NS net23.cc

first two won't work yet because you haven't made any A records
the 8s uses google's dns to check, rather than whatever is local

== ssl certificate

acm, list certificates, request
request a public certificate
add another name to this certificate to get two boxes, then enter
net23.cc
*.net23.cc
defaults of dns validation, rsa2048, request

at this point you can get the ARN
and status is pending validation

there's a button create records in route53
follow that flow, it'll make a cname record
in route53 you can see it made the record
still pending, taking a few minutes, then issued, green check

then put the ARN in .env and run the script:

$ serverless deploy





# Before running this script, do these steps manually:
# At a third-party registrar, register your domain name, net23.cc
# On the Route 53 dashboard, create a hosted zone for net23.cc
# Back at the registrar, set nameservers to those provided by Route 53
# In the AWS Certificate Manager, request an SSL certificate for www.net23.cc and net23.cc
# Perform DNS validation by having the dashboard button add CNAME records
# In the Route 53 hosted zone, create alias records for www and the root domain to point to the CloudFront distribution
# Attach the validated SSL certificate to the CloudFront distribution






Request SSL Certificate: In AWS Certificate Manager (ACM), request a certificate for your domain (e.g., www.net23.cc and net23.cc).
DNS Validation: Perform DNS validation by adding CNAME records through the ACM console to validate the SSL certificate.
Alias Records: Create alias records in the Route 53 hosted zone for www.net23.cc and net23.cc to point to the CloudFront distribution.
Attach SSL Certificate: Attach the validated SSL certificate to the CloudFront distribution.














once at the project start, create and validate the certificate
aws should automatically replace it with a new certificate before expiration

$ serverless deploy --config serverless-certificate.yml --stage prod

script hangs forever
in the cloudformation dashboard, the template update is in progress
in the acm dashboard, there's a button, create records in route 53, you clicked it
after that, the script finishes, 527s later, not sure if because of you clicking the button
now on the dashboards, cloudformation says update complete, acm says issued, both green




















== ssl certificate




once at the start, create certificate

== serverless commands

$ serverless deploy
$ serverless deploy --stage dev
$ serverless deploy --stage prod

blank is the same as stage dev
dev and prod are parallel cloudformation templates, but don't duplicate buckets


is how you run a separate script


$ serverless deploy --stage prod


















chose bucket names:
www-net23-cc
vhs-net23-cc






configure domain name, manual

make and configure s3 bucket and cloudfront distribution, template
deploy static website, template
















back in aws amplify
all apps, cold1, domain management, add domain
dropdown includes cold1.cc from creating the hosted zone, configure domain
by default it looks like cold1.cc goes to main, www.cold1.cc also does, and there's a redirect from cold1.cc to www.cold1.cc
you want the reverse, but are going to keep things this way for now
save button, status about ssl creation, configuration, domain activiation
message appears about needing to verify with the cname code, but then disappears as, if you remember correctly, one part of amazon does this automatically with the other part
yes, took a few minutes, and linked to a box that had instructions for setting these manually:
@      ANAME    d1i6xgg9kph0mt.cloudfront.net
www    CNAME    d1i6xgg9kph0mt.cloudfront.net
but then did it automatically, now saying wait 30min

30min later, it's all working
http or https, www or just cold1.cc, all redirect to https://www.cold1.cc

























```










