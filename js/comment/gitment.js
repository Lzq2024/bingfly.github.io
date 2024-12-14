if ($('#comments-template')) {
	var gitalk = new Gitalk({
  		clientID: window.commentConfig.client_id,
 	        clientSecret: window.commentConfig.client_secret,
  		repo: window.commentConfig.owner,
  		owner: window.commentConfig.id,
  		admin: ['Lzq2024'],
		id: window.commentConfig.id,
//		labels: 'gitalk',
//  		perPage: 15,
//		pagerDirection: 'last',
//		createIssueManually: true,
  		distractionFreeMode: true
	//	id: window.commentConfig.id,
	//	owner: window.commentConfig.owner,
	//	repo: window.commentConfig.repo,
	//	oauth: {
	//		client_id: window.commentConfig.client_id,
	//		client_secret: window.commentConfig.client_secret
	//	},
	//	perPage: 10,
	//	title: window.commentConfig.title,
	//	theme: galTheme
	})

	gitalk.render('comments-template')
}

// 获取最新评论
if ($('#sidebar-recent_comments')) {
	const $recentComments = $('#sidebar-recent_comments')
	const $listGroup = $recentComments.find('ul.list-group')
	const owner = window.commentConfig.owner
	const repo = window.commentConfig.repo
	$.ajax({
		url: "https://api.github.com/repos/" + owner + '/' + repo + '/issues/comments',
		data: {
			sort: 'created',
			direction: 'desc'
		},
		beforeSend: function(request) {
			request.setRequestHeader("Accept", "application/vnd.github.squirrel-girl-preview, application/vnd.github.html+json");
		},
	}).done(function(comments) {
		if(comments.length === 0) {
			$recentComments.css('display', 'none')
		}
		$listGroup.each(function () {
			const recentComments = comments.slice(0, 5)
			const that = this
			for(var m = 0; m < recentComments.length; m++) {
				// 不用let, 就只能用立即执行的匿名函数了
				(function (index) {
					$.ajax({
						url: recentComments[index].issue_url
					}).done(function (issue) {

						const li = document.createElement('li')
						li.className = 'list-group-item'

						const span = document.createElement('span')
						span.className = 'author-avatar'
						const img = document.createElement('img')
						img.className = 'avatar'
						img.setAttribute('width', '40')
						img.setAttribute('height', '40')
						img.setAttribute('src', recentComments[index].user.avatar_url)
						span.appendChild(img)
						li.appendChild(span)

						const content = document.createElement('div')
						content.className = 'hint--left hint--rounded'
						content.setAttribute('data-hint2', '《' + issue.title + '》' + recentComments[index].user.login + ':')
						content.onclick = function () {
							window.location.href = decodeURIComponent(issue.body)
						}
						const log = document.createElement('div')
						log.className = 'comment-log'
						log.innerHTML = recentComments[index].body_html
						content.appendChild(log)

						li.appendChild(content)
						that.appendChild(li)
					})
				})(m)
			}

		})
	}).fail(function (error) {
		console.log(error)
	});
}

// 获取评论总数
if ($('.article-excerpt').length >= 1) {
	const $excerpts = $('.article-excerpt')
	const owner = window.commentConfig.owner
	const repo = window.commentConfig.repo
	$.ajax({
		url: "https://api.github.com/repos/" + owner + '/' + repo + '/issues',
		data: {
			creator: owner
		}
	}).done(function(issues) {
		console.log(issues)
		$excerpts.each(function () {
			const that = $(this)
			that.find('h1 > a > span').each(function () {
				const title = $(this).text()
				const tags = that.find('div.tag-article')
				const issue = issues.filter(function (issue) {
					return issue.title === title
				})
				const comments = issue.length > 0 ? issue[0].comments : 0
				tags.each(function () {
					$(this).append('<span class="label label-gal"><i class="fa fa-comments"></i><a> ' + comments + '</a></span>')
				})
			})
		})
	}).fail(function (error) {
		console.log(error)
	});
}

function formatDate(date) {
	var year = date.getFullYear()
	var month = date.getMonth() + 1 >= 10 ? date.getMonth() + 1 : '0' + (date.getMonth() + 1)
	var day = date.getDate() >= 10 ? date.getDate() : '0' + date.getDate()
	var timeZone
	if(date.getHours() === 12) {
		timeZone = '中午'
	} else if(date.getHours() > 12) {
		timeZone = '下午'
	} else {
		timeZone = '上午'
	}
	var minutes = date.getMinutes() >= 10 ? date.getMinutes() : '0' + date.getMinutes()
	return year + '年' + month + '月' + day + '日 ' + timeZone + date.getHours() + ':' + minutes
}

// goLoginLink
function loginLink() {
	const oauthUri = 'https://github.com/login/oauth/authorize?scope=public_repo'
	const redirect_uri = window.commentConfig.redirect_uri || window.location.href
	const client_id = window.commentConfig.client_id
	const client_secret = window.commentConfig.client_secret
	return oauthUri + '&redirect_uri=' + redirect_uri + '&client_id=' + client_id + '&client_secret=' + client_secret
}

// 添加表情字符串
function addEmoji(index) {
	var myField
	var myCommentTextarea = "comment"
	index = '![:' + (index >= 10 ? '0' + index : '00' + index) + ':](' + window.location.origin + '/imgs/smilies/' + index + '.png)'
	if (document.getElementById(myCommentTextarea) && document.getElementById(myCommentTextarea).type === 'textarea') {
		myField = document.getElementById(myCommentTextarea)
	} else {
		return false
	}
	if (document.selection) {
		myField.focus()
		var sel = document.selection.createRange()
		sel.text = index
		myField.focus()
	} else if (myField.selectionStart || myField.selectionStart === '0') {
		var startPos = myField.selectionStart
		var endPos = myField.selectionEnd
		var cursorPos = endPos
		myField.value = myField.value.substring(0, startPos) + index + myField.value.substring(endPos, myField.value.length)
		cursorPos += index.length
		myField.focus()
		myField.selectionStart = cursorPos
		myField.selectionEnd = cursorPos
	} else {
		myField.value += index
		myField.focus()
	}
}

function goReply(state, comment) {
	if(!state.user.login) {
		window.location.href = loginLink()
	} else {
		var myField = document.getElementById('comment')
		var text = '[@' + comment.user.login + '](https://github.com/' + comment.user.login + ')'
		myField.value = text + myField.value.substring(0, myField.value.length)
		myField.focus()
		myField.selectionStart += text.length
		myField.selectionEnd += text.length
	}
}