this is a guide to pushing a nest app to ecs
1.crearte an instance and allow  ssh
2 connect to the instance
since im on windows ill use wsl
put the pem file in wsl .for now im using this path /home/eugene/aws-pem/mylog.pem
now connect using wsl by runnig the folowing comands in wsl and replce mylog.pem with the path
Connect to your instance using its Public DNS:
ec2-13-60-49-249.eu-north-1.compute.amazonaws.com

Example:

ssh -i "mylog.pem" ubuntu@ec2-13-60-49-249.eu-north-1.compute.amazonaws.com
 
 3 install softwere
to install node use nvm
use the docs  here is the link https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/setting-up-node-on-ec2-instance.html


4 get the code to the instace
for this ill use git clone


5 now its time to ennable https 

