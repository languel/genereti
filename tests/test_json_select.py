import unittest
from test_switching import dat
class JsonSelector(unittest.TestCase):
    def test_source_precedence_and_pass_through(self):
        data=dat.tables.from_json('{"a":1}')
        self.assertIs(dat.JSON.execute(text='bad json',input=data,json='bad json').result[0],data)
        self.assertEqual(dat.JSON.execute(text='bad',json='[0,false,null]').result[0]['jsonValue'],[0,False,None])
    def test_dictionary_and_original_indices(self):
        self.assertEqual(dat.JSON.execute(text='{"speed":0.5,"pose":{"x":1}}',filter='POSE',selection='1').result[0]['jsonValue'],{'pose':{'x':1}})
        self.assertEqual(dat.JSON.execute(text='["red","blue","red",false,0,null]',filter='red',selection='2').result[0]['jsonValue'],['red'])
        self.assertEqual(dat.JSON.execute(text='[false,0,null]',selection=' 0, 2 ').result[0]['jsonValue'],[False,None])
        with self.assertRaises(ValueError):dat.JSON.execute(text='[]',selection='-1')
    def test_dat_rows(self):
        self.assertEqual(dat.JSON.execute(text='',input={'rows':[['a','1'],['b','2']]},filter='b').result[0],{'rows':[['b','2']]})
