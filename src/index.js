require('./index.css');


var myModule = {
    friendsArray: undefined,
    leftFriendList: undefined,
    rightFriendList: undefined,

    init: function () {
        var self = this;
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

        function callAPI(method, params) {
            return new Promise((resolve, reject) => {
                let firstList = document.getElementById('myFriends'),
                    secondList = document.getElementById('myFriendsList');
                if (localStorage.getItem('leftFriends') || localStorage.getItem('rightFriends')) {
                    var leftFriend = JSON.parse(localStorage.getItem('leftFriends'));
                    var rightFriend = JSON.parse(localStorage.getItem('rightFriends'));

                    leftFriend = leftFriend.leftArrayFriend.items;
                    rightFriend = rightFriend.rightArrayFriend;

                    self.leftFriendList = leftFriend;
                    self.rightFriendList = rightFriend;

                    firstList.innerHTML = self.createFriendsDiv(leftFriend);
                    secondList.innerHTML = self.createFriendsDiv(rightFriend);

                    if (leftFriend || rightFriend) {
                        resolve();
                    }
                } else {
                    VK.api(method, params, function (result) {
                        if (result.error) {
                            reject();
                        } else {
                            resolve(result.response);
                            self.friendsArray = result.response;
                            self.leftFriendList = result.response;
                            self.rightFriendList = [];
                        }
                    });
                }
            });
        }

        var friendsList = document.querySelector('#myFriends');

        login()
            .then(() => callAPI('friends.get', {v: 5.63, fields: ['photo_100']}))
            .then(function (result) {
                friendsList.innerHTML = self.createFriendsDiv(result.items);
                self.setListeners();
                self.addPlusFriend();
            })
            .catch(() => console.log('всё плохо'));
    },

    createFriendsDiv: function (leftFriendList, rightFriendList) {
        var templateFn = require('../friend-template.hbs');

        this.updateFriend();

        return templateFn({
            leftFriend: leftFriendList,
            rightFriend: rightFriendList
        });
    },

    setListeners: function () {
        let firstList = document.getElementById('myFriends'),
            secondList = document.getElementById('myFriendsList'),
            list = document.getElementById('secondFriendList'),
            item,
            firstInput = document.querySelector('#input-search-leftFriend'),
            secondInput = document.querySelector('#input-search-rightFriend'),
            leftArrayFriend = this.leftFriendList,
            rightArrayFriend = this.rightFriendList,
            buttonSave = document.querySelector('#button');

        secondList.appendChild(list);

        buttonSave.addEventListener('click', function () {
            localStorage.rightFriends = JSON.stringify({rightArrayFriend});
            localStorage.leftFriends = JSON.stringify({leftArrayFriend});
        });

        firstInput.addEventListener('keyup', this.filtration);
        secondInput.addEventListener('keyup', this.filtration);

        firstList.addEventListener('dragstart', dragStart);
        secondList.addEventListener('dragstart', dragStart);

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

        function dropElement(e) {
            let firstListUl = document.getElementById('firstFriendList'),
                secondListUl = document.getElementById('secondFriendList'),
                spanItem = item.lastElementChild;

            firstList.addEventListener('dragstart', dragStart);
            secondList.addEventListener('dragstart', dragStart);

            if (e.target === secondListUl || e.target.parentNode === secondListUl || e.target.parentNode.parentNode === secondListUl) {
                secondListUl.appendChild(item);
                spanItem.className = '';
                spanItem.className = 'icon-cross';
                var idFriendSecond = spanItem.getAttribute('data-id');

                for (var n = 0; n < leftArrayFriend.items.length; n++) {
                    if (leftArrayFriend.items[n].id == idFriendSecond) {
                        rightArrayFriend.push(leftArrayFriend.items[n]);
                        leftArrayFriend.items.splice(n, 1);
                    }
                }
            }
            else if (e.target === firstListUl || e.target.parentNode === firstListUl || e.target.parentNode.parentNode === firstListUl) {
                firstListUl.appendChild(item);
                spanItem.className = '';
                spanItem.className = 'icon-plus';
                var idFriend = spanItem.getAttribute('data-id');

                for (var i = 0; i < rightArrayFriend.length; i++) {
                    if (rightArrayFriend[i].id == idFriend) {
                        leftArrayFriend.items.push(rightArrayFriend[i]);
                        rightArrayFriend.splice(i, 1);

                    }
                }
            }
        }
},

    addPlusFriend: function () {
    var firstListUl = document.getElementById('firstFriendList'),
        secondListUl = document.getElementById('secondFriendList'),
        leftArrayFriend = this.leftFriendList,
        rightArrayFriend = this.rightFriendList;

    firstListUl.addEventListener('click', function (e) {
        var idFriend = e.target.getAttribute('data-id'),
            el = e.target.parentNode,
            icon = e.target;

        for (var i = 0; i < leftArrayFriend.items.length; i++) {
            if (leftArrayFriend.items[i].id == idFriend) {
                rightArrayFriend.push(leftArrayFriend.items[i]);
                leftArrayFriend.items.splice(i, 1);
            }
        }

        if (e.target.tagName === 'SPAN') {
            firstListUl.removeChild(el);
            secondListUl.appendChild(el);
            icon.className = '';
            icon.className = 'icon-cross';
        }
    });

    secondListUl.addEventListener('click', function (e) {
        var idFriendSecond = e.target.getAttribute('data-id'),
            elem = e.target.parentNode,
            icon = e.target;

        for (var i = 0; i < rightArrayFriend.length; i++) {
            if (rightArrayFriend[i].id == idFriendSecond) {
                leftArrayFriend.items.push(rightArrayFriend[i]);
                rightArrayFriend.splice(i, 1);
            }
        }

        if (e.target.tagName === 'SPAN') {
            secondListUl.removeChild(elem);
            firstListUl.appendChild(elem);
            icon.className = '';
            icon.className = 'icon-plus';
        }
    });
},

    compare: function (a, b) {
    if (a.last_name < b.last_name) return -1;
    if (a.last_name > b.last_name) return 1;
},

    updateFriend: function () {
        let updateLeftFriend = this.leftFriendList.items,
            updateRightFriend = this.rightFriendList,
            self = myModule;

        if (updateRightFriend) {
            updateLeftFriend.sort(self.compare);
            updateRightFriend.sort(self.compare);
        } else {
            updateLeftFriend.sort(self.compare);
        }
    },

    filtration: function () {
        let self = myModule,
            firstList = document.getElementById('myFriends'),
            secondList = document.getElementById('myFriendsList'),
            leftFriendsArray = self.leftFriendList.items,
            rightFriendsArray = self.rightFriendList,
            filtrationLeftList = [],
            filtrationRightList = [],
            value = this.value.trim(),
            firstInput = document.getElementById('input-search-leftFriend'),
            secondInput = document.getElementById('input-search-rightFriend');

        if (firstInput.value) {
            for (let i = 0; i < leftFriendsArray.length; i++) {
                let name = leftFriendsArray[i].last_name;
                if (isMatching(name, value)) {
                    filtrationLeftList.push(leftFriendsArray[i]);
                }
            }
            firstList.innerHTML = self.createFriendsDiv(filtrationLeftList);
            filtrationLeftList = [];
        }
        else if (secondInput.value) {
            for (let i = 0; i < rightFriendsArray.length; i++) {
                let name = rightFriendsArray [i].last_name;
                if (isMatching(name, value)) {
                    filtrationRightList.push(rightFriendsArray[i]);
                }
            }
            secondList.innerHTML = self.createFriendsDiv(filtrationRightList);
            filtrationRightList = [];
        }

        function isMatching(full, chunk) {
            let str = full.toLowerCase(),
                substr = chunk.toLowerCase();
            if (str.indexOf(substr) + 1) {
                return true;
            }
            return false;
        }
    }
};
window.onload = myModule.init();