require('./index.css');

let myModule = {
    leftFriendList: undefined,      //  левый массив объектов из друзей
    rightFriendList: undefined,     // правый массив объектов из друзей

    init: function () {
        let self = this;

        function login() {
            return new Promise((resolve, reject) => {
                VK.init({
                    apiId: 5943284
                });
                VK.Auth.login(function (result) {
                    if (result.status == 'connected') {
                        resolve();
                    } else {
                        reject();
                    }
                });
            });
        }
        // функциия получение массива из лбъектов друзей
        function callAPI(method, params) {
            return new Promise((resolve, reject) => {
                let firstList = document.getElementById('myFriends'),
                    secondList = document.getElementById('myFriendsList');
                if (localStorage.getItem('leftFriends') || localStorage.getItem('rightFriends')) {
                    let leftFriend = JSON.parse(localStorage.getItem('leftFriends'));
                    let rightFriend = JSON.parse(localStorage.getItem('rightFriends'));

                    leftFriend = leftFriend.leftArrayFriend;
                    rightFriend = rightFriend.rightArrayFriend;

                    self.leftFriendList = leftFriend;
                    self.rightFriendList = rightFriend;

                    firstList.innerHTML = myModule.createFriendsDiv(leftFriend);
                    secondList.innerHTML = myModule.createRightFriendsDiv(rightFriend);
                    if (leftFriend || rightFriend) {
                        resolve();
                    }

                } else {
                    VK.api(method, params, function (result) {
                        if (result.error) {
                            reject();
                        } else {
                            resolve(result.response.items);
                            self.leftFriendList = result.response.items.sort(self.compare);
                            self.rightFriendList = [];
                        }
                    });
                }
            });
        }

        let friendsList = document.querySelector('#myFriends'),
            secondList = document.querySelector('#myFriendsList');
        //  последовательное виполнение кода
        login()
            .then(() => callAPI('friends.get', {v: 5.63, fields: ['photo_100']}))
            .then(function (result) {
                if (!localStorage.length) {
                    friendsList.innerHTML = self.createFriendsDiv(result);
                    secondList.innerHTML = self.createRightFriendsDiv(self.rightFriendList);
                }
                self.setListeners();
            })
            .catch(() => console.log('Все плохо!!!!'));
    },
    //  функции рисовки друзей
    createFriendsDiv: function (leftFriendList) {
        let templateFn = require('../friend-template.hbs');

        return templateFn({
            leftFriend: leftFriendList
        });
    },
    createRightFriendsDiv: function (rightFriendList) {
        let templateFn = require('../friend-template-second-list.hbs');

        return templateFn({
            rightFriend: rightFriendList
        });
    },
    // Функция которая отвечает за обработчики и D&D
    setListeners: function () {
        let firstList = document.getElementById('myFriends'),
            secondList = document.getElementById('myFriendsList'),
            firstListUl = document.getElementById('firstFriendList'),
            secondListUl = document.getElementById('secondFriendList'),
            firstInput = document.querySelector('#input-search-leftFriend'),
            secondInput = document.querySelector('#input-search-rightFriend'),
            buttonSave = document.querySelector('#button'),
            leftArrayFriend = this.leftFriendList,
            rightArrayFriend = this.rightFriendList,
            self = myModule,
            item;

        secondList.appendChild(secondListUl);
        //  кнопка сохранения в localStorage
        buttonSave.addEventListener('click', function () {
            localStorage.rightFriends = JSON.stringify({rightArrayFriend});
            localStorage.leftFriends = JSON.stringify({leftArrayFriend});
        });
        //  обработчик на перемещения с первого в второй список по клику
        firstListUl.addEventListener('click', (e) => {
            let elem = e.target.parentNode;
            if (e.target.tagName == 'SPAN') {
                let icon = e.target,
                    idFriendSecond = icon.getAttribute('data-id');

                firstListUl.removeChild(elem);
                secondListUl.appendChild(elem);

                icon.className = '';
                icon.className = 'icon-cross';

                for (let n = 0; n < leftArrayFriend.length; n++) {
                    if (leftArrayFriend[n].id == idFriendSecond) {
                        rightArrayFriend.push(leftArrayFriend[n]);
                        leftArrayFriend.splice(n, 1);
                    }
                }
            }
        });
        //  обработчик на перемещения с второго в первый список по клику
        secondListUl.addEventListener('click', (e) => {
            let elem = e.target.parentNode;
            if (e.target.tagName == 'SPAN') {
                let icon = e.target,
                    idFriend = icon.getAttribute('data-id');

                secondListUl.removeChild(elem);
                firstListUl.appendChild(elem);

                icon.className = '';
                icon.className = 'icon-plus';

                for (var i = 0; i < rightArrayFriend.length; i++) {
                    if (rightArrayFriend[i].id == idFriend) {
                        leftArrayFriend.push(rightArrayFriend[i]);
                        rightArrayFriend.splice(i, 1);
                    }
                }
            }
        });
        //  обработчик на Input, для поиска в первому списку
        firstInput.addEventListener('keyup', () => {
            let filtrationFirstList = [],
                value = firstInput.value.trim();

            for (let i = 0; i < leftArrayFriend.length; i++) {
                let name = leftArrayFriend[i].first_name + ' ' + leftArrayFriend[i].last_name;
                if (self.isMatching(name, value)) {
                    filtrationFirstList.push(leftArrayFriend[i]);
                }
            }
            firstList.innerHTML = self.createFriendsDiv(filtrationFirstList);
        });

        //  обработчик на Input, для поиска в второму списку
        secondInput.addEventListener('keyup', () => {
            let filtrationSecondList = [],
                value = secondInput.value.trim();

            for (let i = 0; i < rightArrayFriend.length; i++) {
                let name = rightArrayFriend[i].first_name + ' ' + rightArrayFriend[i].last_name;
                if (self.isMatching(name, value)) {
                    filtrationSecondList.push(rightArrayFriend[i]);
                }
            }
            secondList.innerHTML = self.createRightFriendsDiv(filtrationSecondList);
        });

        firstList.addEventListener('dragstart', dragStart);
        secondList.addEventListener('dragstart', dragStart);
        //  D&D HTML 5, функция отвечает за клик по элементу и его захват
        function dragStart(e) {
            firstList.removeEventListener('dragstart', dragStart);
            secondList.removeEventListener('dragstart', dragStart);

            firstList.addEventListener('dragenter', dragEnter);
            secondList.addEventListener('dragenter', dragEnter);

            firstList.addEventListener('dragover', dragOver);
            secondList.addEventListener('dragover', dragOver);

            firstList.addEventListener('drop', dropElement);
            secondList.addEventListener('drop', dropElement);

            item = e.target;
        }

        function dragEnter(e) {
            e.preventDefault();
        }

        function dragOver(e) {
            e.preventDefault();
        }
        //  D&D HTML 5, функция отвечает за drop элемента
        function dropElement(e) {
            let spanItem = item.lastElementChild;

            firstList.addEventListener('dragstart', dragStart);
            secondList.addEventListener('dragstart', dragStart);

            if (e.target === secondListUl || e.target.parentNode === secondListUl || e.target.parentNode.parentNode === secondListUl) {
                secondListUl.appendChild(item);
                spanItem.className = '';
                spanItem.className = 'icon-cross';
                let idFriendSecond = spanItem.getAttribute('data-id');

                for (let n = 0; n < leftArrayFriend.length; n++) {
                    if (leftArrayFriend[n].id == idFriendSecond) {
                        rightArrayFriend.push(leftArrayFriend[n]);
                        leftArrayFriend.splice(n, 1);
                    }
                }
            }
            else if (e.target === firstListUl || e.target.parentNode === firstListUl || e.target.parentNode.parentNode === firstListUl) {
                firstListUl.appendChild(item);
                spanItem.className = '';
                spanItem.className = 'icon-plus';
                let idFriend = spanItem.getAttribute('data-id');

                for (let i = 0; i < rightArrayFriend.length; i++) {
                    if (rightArrayFriend[i].id == idFriend) {
                        leftArrayFriend.push(rightArrayFriend[i]);
                        rightArrayFriend.splice(i, 1);
                    }
                }
            }
        }
    },
    //  функция каторая ищит строку в строке
    isMatching: function(full, chunk) {
        let str = full.toLowerCase(),
            substr = chunk.toLowerCase();
        if (str.indexOf(substr) + 1) {
            return true;
        }
        return false;
    },
    //  функция фильтрации для загрузившегося списка
    compare: function (a, b) {
        if (a.last_name < b.last_name) return -1;
        if (a.last_name > b.last_name) return 1;
    }
};

window.onload = myModule.init();
