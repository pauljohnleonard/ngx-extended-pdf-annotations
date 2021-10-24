

# For me to deply demo no use to anyone else.
export AWS_PROFILE=longground
export BUCKET=ngx-annotations
  
ng b  --configuration=production

aws s3 sync  --acl public-read dist/ngx-extended-pdf-annotations-demo s3://${BUCKET}/ --cache-control 'max-age=0' --exclude "*.js"
aws s3 sync  --acl public-read dist/ngx-extended-pdf-annotations-demo s3://${BUCKET}/ --cache-control 'max-age=0' --exclude "*" --include "*.js" --content-type application/javascript


