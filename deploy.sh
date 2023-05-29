cd ./api
npm run build
cd ../
npm run cdk bootstrap
cdk deploy --outputs-file ./cdk-outputs.json