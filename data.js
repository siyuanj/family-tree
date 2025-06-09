const initialFamilyData = [
    { id: 'JiangZiwen', name: '蒋子文', gender: 'male', info: '未知 - 1991', spouseId: null, fatherId: null, motherId: null, tooltip: '家族的沅江分支始祖' },
    { id: 'ZengzuFu', name: '曾祖父', gender: 'male', info: '', spouseId: 'ZengzuMu', fatherId: 'JiangZiwen', motherId: null, tooltip: '由蒋子文过继' },
    { id: 'ZengzuMu', name: '曾祖母', gender: 'female', info: '', spouseId: 'ZengzuFu', fatherId: null, motherId: null, tooltip: '曾祖父的妻子' },
    { id: 'JiangLuosheng', name: '蒋罗生', gender: 'male', info: '1940 - 至今', spouseId: 'ZhuHui', fatherId: 'ZengzuFu', motherId: 'ZengzuMu', tooltip: '我的爷爷' },
    { id: 'ZhuHui', name: '祝辉', gender: 'female', info: '', spouseId: 'JiangLuosheng', fatherId: null, motherId: null, tooltip: '我的奶奶' },
    { id: 'JiangJianhong', name: '蒋建宏', gender: 'male', info: '1965年生', spouseId: null, fatherId: 'JiangLuosheng', motherId: 'ZhuHui', tooltip: '伯父' },
    { id: 'JiangLiyun', name: '蒋丽云', gender: 'female', info: '', spouseId: null, fatherId: 'JiangLuosheng', motherId: 'ZhuHui', tooltip: '姑姑' },
    { id: 'JiangJianjun', name: '蒋建军', gender: 'male', info: '1965年生', spouseId: 'LiuFang', fatherId: 'JiangLuosheng', motherId: 'ZhuHui', tooltip: '我的父亲' },
    { id: 'LiuFang', name: '刘芳', gender: 'female', info: '', spouseId: 'JiangJianjun', fatherId: null, motherId: null, tooltip: '我的母亲' },
    { id: 'JiangSiyuan', name: '蒋思源', gender: 'male', info: '2003年生', spouseId: null, fatherId: 'JiangJianjun', motherId: 'LiuFang', tooltip: '我' }
];