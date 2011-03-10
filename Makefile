
test:
	@echo "testing"
	@expresso \
		-s test/test* \
		-t 5000

docs:
	@ echo "... generating docs"
	@dox --desc "Homer's favoriate Javascript ORM" --ribbon http://github.com/weepy/mmmodel > docs/index.html	--title mmmodel lib/*.js 
	
.PHONY: test docs


