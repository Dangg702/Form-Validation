// Khi người dùng khai báo với từ khóa new thì hàm Validator đóng vai trò là 1 contructor function
// từ khóa this nằm trong constructor func sẽ tương đương với obj mà hàm này tạo ra
function Validator(formSelector){
    //var _this = this; // đây là cách xử lý của ES5

    // tạo ra 1 obj chứa tất cả các rules
    var formRules = {};

    /**
     * Quy ước tạo rule:
     * 1. Nếu có lỗi thì return `error message`
     * 2. Nếu không có lỗi thì return `undefined`
     */
    var validatorRules = {
        required: function(value){
            // KT điều kiện và gán lại giá trị cho value
            (typeof value === 'string') ? value = value.trim() : value;

            // trả về message
            return (value) ? undefined : "This field is required";
        },
        email: function(value){
            var regex = /^[a-z][a-z0-9_\.]{5,32}@[a-z0-9]{2,}(\.[a-z0-9]{2,4}){1,2}$/;
            return (regex.test(value)) ? undefined : "This field must be email";
        },
        min: function(min){
            return function(value){
                var regex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z]{6,}$/;
                return (regex.test(value) && value.length >= min) ? undefined : `This field must be greater than ${min} characters and contain at least one uppercase letter, one lowercase letter, one number`;
            }
        },
        max: function(max){
            return function(value){
                var regex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z]{6,}$/;
                return (regex.test(value) && value.length <= max) ? undefined : `This field must be less than ${max} characters and contain at least one uppercase letter, one lowercase letter, one number`;
            }
        },
        confirmed: function(selector){
            var confirmElement = document.querySelector(formSelector + ' ' + selector);
            if(confirmElement){
                return function(value){
                    return (value === confirmElement.value) ? undefined : "Input value does not match";
                }
            }
        }
    };

    var formElement = document.querySelector(formSelector);
    if(formElement){
        // Lấy ra tất cả các field có attribute là name và rules
        var inputs = formElement.querySelectorAll('[name][rules]');
        
        for (var input of inputs){
            // Giá trị của attribute tự định nghĩa đc lấy thông qua phương thức `.getAttribute`
            // Đưa giá trị của attr rules và obj formRules
            // cắt chuỗi thành arr
            var rules = input.getAttribute('rules').split('|');
            for(var rule of rules) {

                var ruleInfo;
                var isRuleHasValue = rule.includes(':');

                if(isRuleHasValue){
                    ruleInfo = rule.split(':');
                    rule = ruleInfo[0];
                }

                var ruleFunc = validatorRules[rule];
                
                // KT và xử lý trường hợp rule có value (min:6) trước khi push kq cuối cùng vào formRules
                if(isRuleHasValue){
                    ruleFunc = ruleFunc(ruleInfo[1]);
                }

                if(Array.isArray(formRules[input.name])){
                    formRules[input.name].push(ruleFunc);
                }else {
                    formRules[input.name] = [ruleFunc];
                }
            }

            // Lắng nghe sự kiện để validate (blur, change, input)
            input.onblur = handleValidate;
            input.oninput = handleClearError;
        }

        // Hàm thực hiện validate
        function handleValidate(event){
            var rules = formRules[event.target.name];
            var errorMessage; 

            for (rule of rules){
                switch (event.target.type) {
                    case 'radio':
                    case 'checkbox':
                        var inputChecked = formElement.querySelector(`input[name="${event.target.name}"][rules]:checked`)
                        errorMessage = rule(inputChecked)
                        break;
                    default:
                        errorMessage = rule(event.target.value)
                }
                if(errorMessage) break;
            }

            if(errorMessage){
                var formGroup = event.target.closest('.form-group');
                formGroup.classList.add('invalid');

                // từ thẻ đang đứng --> lấy ra class `error-message` của form-group
                var formMessage = formGroup.querySelector('.error-message');
                if(formMessage){
                    formMessage.innerText = errorMessage;
                }
            }
            return !errorMessage;
        }
        // Hàm clear message error
        function handleClearError(event){
            var formGroup = event.target.closest('.form-group');
            if(formGroup.classList.contains('invalid')){
                formGroup.classList.remove('invalid');
                var formMessage = formGroup.querySelector('.error-message');
                if (formMessage) {
                    formMessage.innerText = "";
                }
            }
        }
    }

    // Xử lý hành vi submit form
    formElement.onsubmit = (event) =>{
        event.preventDefault();
        var inputs = formElement.querySelectorAll('[name][rules]');
        var isValid = true;
        for (var input of inputs){
            if(!handleValidate({target: input})){
                isValid = false;
            }
        }

        // Khi không có lỗi thì submit form
        if(isValid){
            if(typeof this.onSubmit === 'function'){
                var enableInputs = formElement.querySelectorAll('[name]');
                var formValues = Array.from(enableInputs).reduce(function(values, input){
                    switch(input.type){
                        case 'radio':
                            values[input.name] = formElement.querySelector('input[name="' + input.name + '"]:checked').value;
                            break;
                        case 'checkbox':
                            if(!input.matches(':checked')){
                                values[input.name] = '';
                                return values;
                            }
                            if(!Array.isArray(values[input.name])){
                                values[input.name] = [];
                            }
                            values[input.name].push(input.value);
                            break;
                        case 'file':
                            values[input.name] = input.files;
                            break;
                        default:
                            values[input.name] = input.value;
                    }
                    return values;
                }, {});
                this.onSubmit(formValues);

            }else{
                // hành vi mặc định của browser
                formElement.submit();
            }
        }
    }

}
